/**
 * AI解题页面组件 - 直接照搬GLM智谱清言的ChatView实现（已修复消息撑开问题）
 */
Vue.component('app-ai-solve', {
  template: `
    <div class="ai-chat-content">
      <h2 class="page-title">AI解题</h2>

      <div class="chat-container">
        <!-- 消息区域 -->
        <div ref="messageContainer" class="chat-messages">
          <div v-if="messages.length === 0" class="chat-empty">
            <i class="fas fa-comment-dots"></i>
            <p>开始您的对话吧！</p>
          </div>
          <div 
            v-for="(msg, index) in messages" 
            :key="index"
            :class="['message-wrapper', msg.role === 'user' ? 'user' : 'ai']"
          >
            <!-- 用户消息：支持文本和图片 -->
            <div 
              v-if="msg.role === 'user'"
              class="message-bubble user"
            >
              <div v-if="msg.images && msg.images.length > 0" class="message-images">
                <img 
                  v-for="(img, imgIndex) in msg.images" 
                  :key="imgIndex"
                  :src="img" 
                  @click="previewImage(img)"
                  class="message-image"
                  alt="上传的图片"
                />
              </div>
              <div v-if="msg.content" class="message-text">{{ msg.content }}</div>
            </div>
            <!-- AI消息：Markdown渲染 -->
            <div 
              v-else
              class="message-bubble ai"
              v-html="renderMarkdown(msg.content)"
            ></div>
          </div>
          <!-- 流式显示当前正在生成的消息（只在有内容时显示） -->
          <div v-if="loading && currentAssistantMessage" class="message-wrapper ai">
            <div 
              class="message-bubble ai"
              v-html="renderMarkdownWithCursor(currentAssistantMessage)"
            ></div>
          </div>
          <!-- 显示"正在思考"加载提示（在等待AI响应时） -->
          <div v-else-if="loading && isThinking" class="message-wrapper ai">
            <div class="message-bubble ai loading-bubble">
              <i class="el-icon-loading"></i>
              <span>正在思考...</span>
            </div>
          </div>
        </div>
        
        <!-- 输入区域 -->
        <div class="chat-input-area">
          <div class="input-wrapper">
            <el-input
              v-model="inputText"
              type="textarea"
              :rows="2"
              placeholder="输入您的问题..."
              @keyup.enter.native.exact="submit"
              @keyup.shift.enter.native="inputText += '\\n'"
              :disabled="loading"
            ></el-input>
            <el-button 
              type="default" 
              @click="clearConversation"
              :disabled="loading || messages.length === 0"
              icon="el-icon-delete"
              circle
              title="清空对话"
            ></el-button>
            <el-button 
              type="primary" 
              @click="submit"
              :disabled="loading ? false : !inputText.trim()"
              :icon="loading ? 'el-icon-video-pause' : 'el-icon-position'"
            >
              {{ loading ? '暂停' : '发送' }}
            </el-button>
          </div>
        </div>
        
        <!-- 图片预览对话框 -->
        <el-dialog
          :visible.sync="previewDialogVisible"
          width="80%"
          :show-close="true"
        >
          <img :src="previewImageUrl" style="width: 100%;" alt="预览" />
        </el-dialog>
      </div>
    </div>
  `,
  data() {
    return {
      messages: [],
      inputText: '',
      loading: false,
      isThinking: false,
      currentAssistantMessage: '',
      chatAbortController: null,
      previewDialogVisible: false,
      previewImageUrl: '',
      settings: {
        model: 'glm-4.5-flash',
        temperature: 0.7,
        max_tokens: 4096
      }
    };
  },
  methods: {
    submit() {
      if (this.loading) {
        this.stopStream();
        return;
      }
      if (this.inputText.trim()) {
        this.handleSendMessage(this.inputText.trim());
        this.inputText = '';
      }
    },
    previewImage(url) {
      this.previewImageUrl = url;
      this.previewDialogVisible = true;
    },
    stopStream() {
      if (this.chatAbortController) {
        try {
          this.chatAbortController.abort();
          this.$message.info('已停止生成');
        } catch (e) {
          console.error('停止流式输出失败:', e);
        }
        this.chatAbortController = null;
      }
      this.loading = false;
      this.isThinking = false;
      this.currentAssistantMessage = '';
    },
    clearConversation() {
      this.$confirm('确定要清除所有消息吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.clearMessages();
      }).catch(() => {});
    },
    scrollToBottom(immediate = false) {
      this.$nextTick(() => {
        const messageContainer = this.$refs.messageContainer;
        if (messageContainer) {
          // 使用scrollTop直接设置，更可靠
          messageContainer.scrollTop = messageContainer.scrollHeight;
          // 如果需要平滑滚动且不是立即滚动
          if (!immediate) {
            setTimeout(() => {
              messageContainer.scrollTop = messageContainer.scrollHeight;
            }, 10);
          }
        }
      });
    },
    renderMarkdown(content) {
      if (!content) return '';
      if (typeof marked !== 'undefined') {
        try {
          marked.setOptions({
            breaks: true,
            gfm: true,
            headerIds: false,
            mangle: false
          });
          return marked.parse(content);
        } catch (e) {
          console.error('Markdown解析错误:', e);
          return content;
        }
      }
      return content;
    },
    renderMathInMessages() {
      if (typeof renderMathInElement === 'undefined') {
        return;
      }
      const messageContainer = this.$refs.messageContainer;
      if (!messageContainer) {
        return;
      }
      try {
        renderMathInElement(messageContainer, {
          delimiters: [
            {left: '$$', right: '$$', display: true},
            {left: '$', right: '$', display: false},
            {left: '\\[', right: '\\]', display: true},
            {left: '\\(', right: '\\)', display: false}
          ],
          throwOnError: false,
          strict: false
        });
      } catch (e) {
        console.error('渲染数学公式失败:', e);
      }
    },
    renderMarkdownWithCursor(content) {
      const html = this.renderMarkdown(content);
      return html + '<span style="display: inline-block; width: 2px; height: 14px; background-color: #409EFF; margin-left: 2px; animation: blink 1s infinite; vertical-align: middle;"></span>';
    },
    async loadHistory() {
      try {
        const response = await window.aiAPI.getHistory(10);
        if (response.success) {
          if (response.data.messages && response.data.messages.length > 0) {
            this.messages = response.data.messages.map(msg => {
              let content = msg.content || '';
              let images = [];
              try {
                if (content.startsWith('{') && content.includes('"images"')) {
                  const parsed = JSON.parse(content);
                  content = parsed.text || '';
                  images = parsed.images || [];
                }
              } catch (e) {}
              return {
                role: msg.role,
                content: content,
                images: images
              };
            });
          } else {
            this.messages = [];
          }
        }
      } catch (error) {
        console.error('加载历史消息失败:', error);
        this.messages = [];
      }
    },
    async clearMessages() {
      try {
        const response = await window.aiAPI.clearMessages();
        if (response.code === 0) {
          this.messages = [];
          this.$message.success('消息已清除');
        }
      } catch (error) {
        console.error('清除消息失败:', error);
        this.messages = [];
        this.$message.error('清除消息失败');
      }
    },
    async handleSendMessage(message) {
      if (!message.trim()) return;
      
      this.loading = true;
      this.isThinking = true;
      this.currentAssistantMessage = '';
      
      try {
        const userMessage = {
          role: 'user',
          content: message.trim() || '',
          images: []
        };
        this.messages.push(userMessage);
        // 发送消息后立即滚动到底部
        this.scrollToBottom(true);
        
        let assistantMessageIndex = this.messages.length;
        let hasReceivedContent = false;
        this.chatAbortController = new AbortController();
        
        await window.aiAPI.sendMessageStream(
          message.trim() || '',
          (chunk) => {
            if (!hasReceivedContent) {
              hasReceivedContent = true;
              this.isThinking = false;
              this.messages.push({ role: 'assistant', content: chunk });
              assistantMessageIndex = this.messages.length - 1;
            } else {
              this.$set(this.messages[assistantMessageIndex], 'content', 
                this.messages[assistantMessageIndex].content + chunk);
            }
            // 每次收到chunk后立即滚动到底部
            this.scrollToBottom(true);
          },
          (fullContent) => {
            this.isThinking = false;
            if (hasReceivedContent) {
              this.$set(this.messages[assistantMessageIndex], 'content', fullContent);
            } else {
              this.messages.push({ role: 'assistant', content: fullContent || '（无回复）' });
            }
            this.chatAbortController = null;
            // 完成时确保滚动到底部
            this.scrollToBottom(true);
          },
          (error) => {
            this.isThinking = false;
            this.$message.error('发送消息失败：' + error);
            if (hasReceivedContent) {
              this.messages.splice(assistantMessageIndex, 1);
            }
            if (this.messages.length > 0 && this.messages[this.messages.length - 1].role === 'user') {
              this.messages.pop();
            }
          },
          this.settings,
          this.chatAbortController
        );
      } catch (error) {
        console.error('发送消息失败:', error);
        this.isThinking = false;
        this.$message.error('发送消息失败：' + (error.message || '未知错误'));
        if (this.messages.length > 0 && this.messages[this.messages.length - 1].role === 'user') {
          this.messages.pop();
        }
      } finally {
        this.loading = false;
        this.isThinking = false;
        this.currentAssistantMessage = '';
      }
    }
  },
  watch: {
    loading(newVal) {
      if (!newVal) {
        this.currentAssistantMessage = '';
      }
    },
    messages: {
      handler() {
        this.scrollToBottom();
        this.$nextTick(() => {
          this.renderMathInMessages();
        });
      },
      deep: true
    },
    currentAssistantMessage() {
      // 流式输出时立即滚动
      this.scrollToBottom(true);
      this.$nextTick(() => {
        this.renderMathInMessages();
        // 渲染数学公式后再次确保滚动到底部
        this.scrollToBottom(true);
      });
    }
  },
  updated() {
    this.$nextTick(() => {
      this.renderMathInMessages();
    });
  },
  mounted() {
    this.loadHistory();
    document.body.classList.add('ai-chat-locked');

    if (!document.getElementById('ai-solve-styles')) {
      const style = document.createElement('style');
      style.id = 'ai-solve-styles';
      style.textContent = `
        body.ai-chat-locked {
          overflow: hidden;
        }

        .ai-chat-content {
          flex: 1;
          padding: 20px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-height: 0;
        }

        .page-title {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 24px;
          color: #2d3748;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }
        
        .page-title::before {
          content: '';
          width: 4px;
          height: 28px;
          background-color: #4299e1;
          border-radius: 2px;
        }
        
        .chat-container {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          height: 640px;
          max-height: calc(100vh - 180px);
          flex-shrink: 0;
        }

        .chat-messages {
          flex: 1;
          min-height: 0; /* 👈 关键修复：允许收缩以触发滚动 */
          overflow-y: auto;
          overflow-x: hidden;
          padding: 20px;
          background-color: #fff;
          box-sizing: border-box;
        }
        
        .chat-messages::-webkit-scrollbar {
          width: 6px;
        }
        
        .chat-messages::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .chat-messages::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }
        
        .chat-messages::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
        
        .chat-messages {
          scrollbar-width: thin;
          scrollbar-color: #c1c1c1 transparent;
        }
        
        .chat-empty {
          text-align: center;
          padding: 60px 20px;
          color: #909399;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        
        .chat-empty i {
          font-size: 64px;
          margin-bottom: 16px;
          opacity: 0.5;
        }
        
        .message-wrapper {
          display: flex;
          margin-bottom: 20px;
          animation: fadeIn 0.3s;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .message-wrapper.user {
          justify-content: flex-end;
        }
        
        .message-wrapper.ai {
          justify-content: flex-start;
        }
        
        .message-bubble {
          max-width: 70%;
          padding: 16px 20px;
          word-wrap: break-word;
          font-size: 14px;
          display: inline-block;
          border-radius: 8px;
          box-sizing: border-box;
          line-height: 1.8;
        }
        
        .message-bubble p {
          margin: 8px 0;
        }
        
        .message-bubble p:first-child {
          margin-top: 0;
        }
        
        .message-bubble p:last-child {
          margin-bottom: 0;
        }
        
        .message-bubble.user {
          background-color: #edf2ff;
          color: #1a202c;
        }
        
        .message-bubble.ai {
          background-color: #f8fafc;
          color: #2d3748;
          border: 1px solid #edf2f7;
        }
        
        .message-bubble code {
          background-color: rgba(0, 0, 0, 0.05);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-size: 13px;
        }
        
        .message-bubble pre {
          background-color: rgba(0, 0, 0, 0.05);
          padding: 12px;
          border-radius: 6px;
          overflow-x: auto;
          margin: 8px 0;
        }
        
        .message-bubble pre code {
          background: none;
          padding: 0;
        }
        
        .message-bubble.user code {
          background-color: rgba(255, 255, 255, 0.2);
        }
        
        .message-bubble.user pre {
          background-color: rgba(255, 255, 255, 0.2);
        }
        
        .message-bubble strong {
          font-weight: 500;
          font-size: 14px;
        }
        
        .message-bubble h1,
        .message-bubble h2,
        .message-bubble h3,
        .message-bubble h4,
        .message-bubble h5,
        .message-bubble h6 {
          font-weight: 500;
          margin: 12px 0 8px 0;
          line-height: 1.5;
        }
        
        .message-bubble h1 {
          font-size: 18px;
        }
        
        .message-bubble h2 {
          font-size: 16px;
        }
        
        .message-bubble h3 {
          font-size: 15px;
        }
        
        .message-bubble ul,
        .message-bubble ol {
          margin: 8px 0;
          padding-left: 24px;
        }
        
        .message-bubble li {
          margin: 4px 0;
        }
        
        .message-images {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 8px;
        }
        
        .message-image {
          max-width: 200px;
          max-height: 200px;
          border-radius: 6px;
          cursor: pointer;
          object-fit: cover;
          border: 1px solid #e2e8f0;
        }
        
        .message-image:hover {
          opacity: 0.8;
        }
        
        .message-text {
          word-wrap: break-word;
        }
        
        .image-preview-area {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 12px;
          background-color: #f8f9fa;
          border-bottom: 1px solid #e2e8f0;
          flex-shrink: 0;
        }
        
        .image-preview-item {
          position: relative;
          width: 80px;
          height: 80px;
          border-radius: 6px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }
        
        .image-preview-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .image-preview-item .el-icon-close {
          position: absolute;
          top: 4px;
          right: 4px;
          background-color: rgba(0, 0, 0, 0.6);
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 12px;
        }
        
        .image-preview-item .el-icon-close:hover {
          background-color: rgba(0, 0, 0, 0.8);
        }
        
        .image-upload-btn {
          display: inline-block;
        }
        
        .loading-bubble {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #909399;
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        
        .chat-input-area {
          border-top: 1px solid #e2e8f0;
          background: #fff;
          padding: 16px 20px;
          flex-shrink: 0;
        }
        
        .input-wrapper {
          display: flex;
          align-items: flex-end;
          gap: 8px;
        }
        
        .input-wrapper .el-textarea {
          flex: 1;
        }
        
        .input-wrapper .el-button {
          flex-shrink: 0;
        }
        
        @media (max-width: 768px) {
          .message-bubble {
            max-width: 85%;
          }
        }
      `;
      document.head.appendChild(style);
    }
  },
  beforeDestroy() {
    document.body.classList.remove('ai-chat-locked');
  }
});