/**
 * AI 对话相关 API - 直接照搬GLM智谱清言的实现
 */
window.aiAPI = {
  /**
   * 发送消息（流式输出）
   * @param {string} message - 消息内容
   * @param {Function} onChunk - 接收流式数据的回调函数 (chunk) => {}
   * @param {Function} onComplete - 完成回调函数 (fullContent) => {}
   * @param {Function} onError - 错误回调函数 (error) => {}
   * @param {Object} settings - 设置参数 {model, temperature, max_tokens}
   * @param {AbortController} abortController - 可选的取消控制器
   */
  sendMessageStream: async function(message, onChunk, onComplete, onError, settings = {}, abortController) {
    const TIMEOUT = 300000; // 5分钟超时
    const HEARTBEAT_TIMEOUT = 60000; // 1分钟无数据超时
    let timeoutId = null;
    let heartbeatTimeoutId = null;
    let reader = null;
    
    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (heartbeatTimeoutId) clearTimeout(heartbeatTimeoutId);
      if (reader) {
        try {
          reader.cancel();
        } catch (e) {
          // 忽略取消错误
        }
      }
    };
    
    const resetHeartbeat = () => {
      if (heartbeatTimeoutId) clearTimeout(heartbeatTimeoutId);
      heartbeatTimeoutId = setTimeout(() => {
        cleanup();
        if (onError) onError('响应超时：超过1分钟未收到数据');
      }, HEARTBEAT_TIMEOUT);
    };
    
    try {
      const token = localStorage.getItem('token') || '';
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: message,
          model: settings.model || 'glm-4.5-flash',
          temperature: settings.temperature || 0.7,
          max_tokens: settings.max_tokens || 4096
        }),
        signal: abortController ? abortController.signal : undefined
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        cleanup();
        if (onError) onError(errorData.message || errorData.error || '请求失败');
        return;
      }

      // 设置总超时
      timeoutId = setTimeout(() => {
        cleanup();
        if (onError) onError('请求超时：超过5分钟未完成');
      }, TIMEOUT);

      reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';
      let lastDataTime = Date.now();

      while (true) {
        // 检查是否被取消
        if (abortController && abortController.signal.aborted) {
          cleanup();
          if (onComplete) onComplete(fullContent);
          return;
        }

        const { done, value } = await reader.read();
        if (done) {
          cleanup();
          // 如果流结束但没有收到 [DONE]，也调用 onComplete
          if (onComplete) onComplete(fullContent);
          return;
        }

        lastDataTime = Date.now();
        resetHeartbeat();

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;
          
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data.trim() === '[DONE]') {
              cleanup();
              if (onComplete) onComplete(fullContent);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                cleanup();
                if (onError) onError(parsed.error);
                return;
              }
              if (parsed.content) {
                fullContent += parsed.content;
                if (onChunk) onChunk(parsed.content);
              }
              if (parsed.done && onComplete) {
                cleanup();
                onComplete(parsed.full_content || fullContent);
                return;
              }
            } catch (e) {
              console.error('解析流式数据失败:', e, '原始数据:', data);
            }
          }
        }
      }
    } catch (error) {
      cleanup();
      console.error('发送消息失败:', error);
      if (error.name === 'AbortError') {
        // 主动停止，不当做错误提示
        if (onComplete) onComplete('');
        return;
      }
      if (onError) {
        onError(error.message || '未知错误');
      }
    }
  },

  /**
   * 获取聊天历史记录 - 照搬GLM的实现
   * @param {number} limit - 返回记录数量限制
   * @returns {Promise<Object>}
   */
  getHistory: async function(limit = 10) {
    try {
      const response = await request.get('/ai/chat/history', {
        params: { limit: limit }
      });
      if (response.code === 0 && response.data && response.data.messages) {
        return {
          success: true,
          data: {
            messages: response.data.messages
          }
        };
      }
      return { success: true, data: { messages: [] } };
    } catch (error) {
      console.error('获取聊天历史失败:', error);
      return { success: false, data: { messages: [] } };
    }
  },

  /**
   * 删除所有聊天历史记录 - 照搬GLM的实现
   * @returns {Promise<Object>}
   */
  clearMessages: async function() {
    try {
      const response = await request.delete('/ai/chat/history');
      return response;
    } catch (error) {
      console.error('删除聊天历史失败:', error);
      throw error;
    }
  }
};




