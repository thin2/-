/**
 * 出卷自测页面组件
 */
Vue.component("app-exam", {
  template: `
    <div class="exam-content">
      <h2 class="page-title">出卷自测</h2>

      <!-- 出卷配置 -->
      <div class="exam-config" v-if="!examStarted">
        <div class="config-card">
          <h3 class="config-title">试卷配置</h3>
          <el-form :model="examConfig" label-width="120px" style="max-width: 600px;">
            <el-form-item label="题目数量">
              <el-input-number v-model="examConfig.questionCount" :min="5" :max="50" :step="5"></el-input-number>
              <span style="margin-left: 8px; color: #718096;">题</span>
            </el-form-item>
            <el-form-item label="难度分布">
              <el-radio-group v-model="examConfig.difficultyMode">
                <el-radio label="all">全部难度</el-radio>
                <el-radio label="simple">仅简单</el-radio>
                <el-radio label="medium">仅中等</el-radio>
                <el-radio label="hard">仅困难</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="出题方式">
              <el-radio-group v-model="examConfig.questionMode">
                <el-radio label="random">随机出题</el-radio>
                <el-radio label="unreviewed">优先未复习</el-radio>
                <el-radio label="important">优先重点题</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="考试时间">
              <el-input-number v-model="examConfig.timeLimit" :min="10" :max="120" :step="5"></el-input-number>
              <span style="margin-left: 8px; color: #718096;">分钟（0为不限时）</span>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" size="large" @click="generateExam" :loading="generating">
                <i class="fas fa-file-alt"></i> 生成试卷
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <!-- 考试进行中 -->
      <div class="exam-taking" v-if="examStarted && !examFinished">
        <div class="exam-header">
          <div class="exam-info">
            <span class="exam-title">自测试卷</span>
            <span class="question-progress">第 {{ currentQuestionIndex + 1 }} / {{ examQuestions.length }} 题</span>
          </div>
          <div class="exam-timer" v-if="examConfig.timeLimit > 0">
            <i class="far fa-clock"></i>
            <span :class="{ 'time-warning': remainingTime < 300 }">{{ formatTime(remainingTime) }}</span>
          </div>
        </div>

        <div class="question-container">
          <div class="question-card">
            <div class="question-header">
              <el-tag :type="getDifficultyType(examQuestions[currentQuestionIndex].difficulty)" size="small">
                {{ getDifficultyLabel(examQuestions[currentQuestionIndex].difficulty) }}
              </el-tag>
              <el-tag type="info" size="small">{{ examQuestions[currentQuestionIndex].subject_name || getSubjectName(examQuestions[currentQuestionIndex].subject_id) }}</el-tag>
            </div>
            <div class="question-content">
              <h3>题目：</h3>
              <div class="question-text">{{ examQuestions[currentQuestionIndex].content || examQuestions[currentQuestionIndex].title }}</div>
            </div>
            <div class="answer-section">
              <h3>我的答案：</h3>
              <el-input 
                type="textarea" 
                :rows="6" 
                v-model="answers[currentQuestionIndex]" 
                placeholder="请输入您的答案..."
              ></el-input>
            </div>
          </div>
        </div>

        <div class="exam-footer">
          <el-button @click="prevQuestion" :disabled="currentQuestionIndex === 0">上一题</el-button>
          <div class="question-nav">
            <el-button 
              v-for="(q, index) in examQuestions" 
              :key="q.id"
              :type="answers[index] ? 'success' : 'default'"
              :class="{ 'current-question': index === currentQuestionIndex }"
              size="mini"
              @click="goToQuestion(index)"
            >
              {{ index + 1 }}
            </el-button>
          </div>
          <el-button @click="nextQuestion" :disabled="currentQuestionIndex === examQuestions.length - 1">下一题</el-button>
          <el-button type="primary" @click="submitExam">提交试卷</el-button>
        </div>
      </div>

      <!-- 考试结果 -->
      <div class="exam-result" v-if="examFinished">

        <div class="result-container">
          <!-- 左侧：正确率和统计 -->
          <div class="result-left">
            <div class="result-header">
              <h2>考试结果</h2>
              <div class="result-score">
                <div class="score-circle">
                  <div class="score-value">{{ examResult.score }}</div>
                  <div class="score-total">/ {{ examQuestions.length }}</div>
                </div>
                <div class="score-percent">{{ examResult.accuracy }}%</div>
              </div>
            </div>

            <div class="result-stats">
              <div class="stat-item">
                <div class="stat-value">{{ examResult.correctCount }}</div>
                <div class="stat-label">正确</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ examResult.wrongCount }}</div>
                <div class="stat-label">错误</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ examResult.unansweredCount }}</div>
                <div class="stat-label">未答</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ formatTime(examResult.timeUsed) }}</div>
                <div class="stat-label">用时</div>
              </div>
            </div>

            <div class="result-actions">
              <el-button type="primary" @click="restartExam">重新出卷</el-button>
            </div>
          </div>

          <!-- 右侧：题目序号 -->
          <div class="result-right">
            <div class="result-details">
              <h3 class="details-title">题目序号</h3>
              <div class="question-number-list">
                <el-button
                  v-for="(detail, index) in examResult.details" 
                  :key="detail.question_id"
                  :type="detail.is_correct ? 'success' : (detail.my_answer === '未作答' ? 'info' : 'danger')"
                  :plain="detail.my_answer === '未作答'"
                  circle
                  size="small"
                  @click="viewQuestionDetail(index)"
                  class="question-number-btn"
                >
                  {{ index + 1 }}
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 题目详情弹窗 -->
        <el-dialog
          title="题目详情"
          :visible.sync="questionDetailVisible"
          width="60%"
          :before-close="closeQuestionDetail"
        >
          <div class="question-detail-content" v-if="currentQuestionDetail">
            <div class="detail-section" v-if="currentQuestionDetail.subject_name">
              <h3>科目：</h3>
              <el-tag type="info" size="small">{{ currentQuestionDetail.subject_name }}</el-tag>
            </div>
            <div class="detail-section" v-if="currentQuestionDetail.difficulty">
              <h3>难度：</h3>
              <el-tag :type="getDifficultyType(currentQuestionDetail.difficulty)" size="small">
                {{ getDifficultyLabel(currentQuestionDetail.difficulty) }}
              </el-tag>
            </div>
            <div class="detail-section">
              <h3>题目：</h3>
              <div class="detail-text">{{ currentQuestionDetail.question_content || currentQuestionDetail.question_title }}</div>
            </div>
            <div class="detail-section">
              <h3>我的答案：</h3>
              <div class="detail-text" :class="{'wrong-answer': !currentQuestionDetail.is_correct && currentQuestionDetail.my_answer !== '未作答'}">
                {{ currentQuestionDetail.my_answer }}
              </div>
            </div>
            <div class="detail-section">
              <h3>正确答案：</h3>
              <div class="detail-text correct-answer">{{ currentQuestionDetail.correct_answer }}</div>
            </div>
            <div class="detail-section">
              <h3>结果：</h3>
              <el-tag :type="currentQuestionDetail.is_correct ? 'success' : 'danger'" size="small">
                {{ currentQuestionDetail.is_correct ? '正确' : '错误' }}
              </el-tag>
            </div>
          </div>
          <span slot="footer" class="dialog-footer">
            <el-button @click="closeQuestionDetail">关闭</el-button>
            <el-button type="primary" @click="prevQuestionDetail" :disabled="currentQuestionDetailIndex === 0">上一题</el-button>
            <el-button type="primary" @click="nextQuestionDetail" :disabled="currentQuestionDetailIndex === examResult.details.length - 1">下一题</el-button>
          </span>
        </el-dialog>
      </div>
    </div>
  `,
  data() {
    return {
      examConfig: {
        questionCount: 20,
        difficultyMode: "all",
        questionMode: "random",
        timeLimit: 0,
      },
      generating: false,
      examStarted: false,
      examFinished: false,
      examQuestions: [],
      answers: [],
      currentQuestionIndex: 0,
      remainingTime: 0,
      timer: null,
      startTime: null,
      examResult: null,
      questionDetailVisible: false,
      currentQuestionDetailIndex: 0,
    };
  },
  methods: {
    async generateExam() {
      this.generating = true;
      try {
        const res = await examAPI.generate({
          question_count: this.examConfig.questionCount,
          difficulty_mode: this.examConfig.difficultyMode,
          question_mode: this.examConfig.questionMode,
          time_limit: this.examConfig.timeLimit,
        });

        if (res && res.data && res.data.questions) {
          this.examQuestions = res.data.questions;
          this.answers = new Array(this.examQuestions.length).fill("");
          this.examStarted = true;
          this.examFinished = false;
          this.currentQuestionIndex = 0;
          this.startTime = Date.now();

          if (this.examConfig.timeLimit > 0) {
            this.remainingTime = this.examConfig.timeLimit * 60;
            this.startTimer();
          }

          this.$message.success("试卷生成成功，开始答题！");
        } else {
          this.$message.error("生成试卷失败");
        }
      } catch (error) {
        console.error("生成试卷失败", error);
        this.$message.error("生成试卷失败: " + (error.message || "未知错误"));
      } finally {
        this.generating = false;
      }
    },
    startTimer() {
      this.timer = setInterval(() => {
        this.remainingTime--;
        if (this.remainingTime <= 0) {
          clearInterval(this.timer);
          this.$message.warning("时间到，自动提交试卷");
          this.submitExam();
        }
      }, 1000);
    },
    formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    },
    prevQuestion() {
      if (this.currentQuestionIndex > 0) {
        this.currentQuestionIndex--;
      }
    },
    nextQuestion() {
      if (this.currentQuestionIndex < this.examQuestions.length - 1) {
        this.currentQuestionIndex++;
      }
    },
    goToQuestion(index) {
      this.currentQuestionIndex = index;
    },
    getDifficultyType(difficulty) {
      const map = { 1: "success", 2: "warning", 3: "danger" };
      return map[difficulty] || "info";
    },
    getDifficultyLabel(difficulty) {
      const map = { 1: "简单", 2: "中等", 3: "困难" };
      return map[difficulty] || "中等";
    },
    getSubjectName(subjectId) {
      const subject = this.subjects.find((s) => s.id === subjectId);
      return subject ? subject.name : "未知";
    },
    async submitExam() {
      if (this.timer) {
        clearInterval(this.timer);
      }

      try {
        await this.$confirm(
          "确定要提交试卷吗？提交后将无法修改答案。",
          "提示",
          {
            confirmButtonText: "确定",
            cancelButtonText: "取消",
            type: "warning",
          }
        );

        const timeUsed = Math.floor((Date.now() - this.startTime) / 1000);
        const questionIds = this.examQuestions.map((q) => q.id);
        const answers = {};
        this.examQuestions.forEach((q, index) => {
          answers[q.id] = this.answers[index] || "";
        });

        const res = await examAPI.submit({
          question_ids: questionIds,
          answers: answers,
          time_used: timeUsed,
        });

        if (res && res.data) {
          this.examResult = {
            score: res.data.score || 0,
            accuracy: res.data.accuracy || 0,
            correctCount: res.data.correct_count || 0,
            wrongCount: res.data.wrong_count || 0,
            unansweredCount: res.data.unanswered_count || 0,
            timeUsed: res.data.time_used || 0,
            details: res.data.details || [],
          };

          this.examFinished = true;
          this.$message.success("试卷提交成功！");
        } else {
          this.$message.error("提交失败");
        }
      } catch (error) {
        if (error !== "cancel") {
          console.error("提交试卷失败", error);
          this.$message.error("提交失败: " + (error.message || "未知错误"));
        }
      }
    },
    restartExam() {
      this.examStarted = false;
      this.examFinished = false;
      this.examQuestions = [];
      this.answers = [];
      this.currentQuestionIndex = 0;
      this.examResult = null;
      this.questionDetailVisible = false;
      this.currentQuestionDetailIndex = 0;
      if (this.timer) {
        clearInterval(this.timer);
      }
    },
    viewQuestionDetail(index) {
      this.currentQuestionDetailIndex = index;
      this.questionDetailVisible = true;
    },
    closeQuestionDetail() {
      this.questionDetailVisible = false;
    },
    prevQuestionDetail() {
      if (this.currentQuestionDetailIndex > 0) {
        this.currentQuestionDetailIndex--;
      }
    },
    nextQuestionDetail() {
      if (
        this.currentQuestionDetailIndex <
        this.examResult.details.length - 1
      ) {
        this.currentQuestionDetailIndex++;
      }
    },
  },
  computed: {
    currentQuestionDetail() {
      if (
        this.examResult &&
        this.examResult.details &&
        this.examResult.details[this.currentQuestionDetailIndex]
      ) {
        const detail = this.examResult.details[this.currentQuestionDetailIndex];
        // 从 examQuestions 中获取完整的题目信息
        const question = this.examQuestions.find(
          (q) => q.id === detail.question_id
        );
        return {
          ...detail,
          question_content: question
            ? question.content || question.title
            : detail.question_title,
          question_type: question ? question.question_type : null,
          difficulty: question ? question.difficulty : null,
          subject_name: question ? question.subject_name : null,
        };
      }
      return null;
    },
  },
  beforeDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  },
  async mounted() {
    // 注入页面样式
    if (!document.getElementById('exam-styles')) {
      const style = document.createElement('style');
      style.id = 'exam-styles';
      style.textContent = `
        .exam-content {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
          background-color: #f5f7fa;
        }
        .exam-content .page-title {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 24px;
          color: #2d3748;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .exam-content .page-title::before {
          content: '';
          width: 4px;
          height: 28px;
          background-color: #4299e1;
          border-radius: 2px;
        }
        .exam-content .config-card {
          background: #fff;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          border: 1px solid #e2e8f0;
        }
        .exam-content .config-title {
          font-size: 18px;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .exam-content .exam-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: #fff;
          border-radius: 12px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          border: 1px solid #e2e8f0;
        }
        .exam-content .exam-info {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .exam-content .exam-title {
          font-size: 18px;
          font-weight: 600;
          color: #2d3748;
        }
        .exam-content .question-progress {
          font-size: 14px;
          color: #718096;
        }
        .exam-content .exam-timer {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 600;
          color: #4299e1;
        }
        .exam-content .exam-timer .time-warning {
          color: #e53e3e;
        }
        .exam-content .question-container {
          flex: 1;
          overflow-y: auto;
          margin-bottom: 20px;
        }
        .exam-content .question-card {
          background: #fff;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          border: 1px solid #e2e8f0;
        }
        .exam-content .question-text {
          font-size: 16px;
          line-height: 1.8;
          color: #2d3748;
          margin-top: 12px;
        }
        .exam-content .answer-section {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #e2e8f0;
        }
        .exam-content .answer-section h3 {
          font-size: 16px;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 12px;
        }
        .exam-content .exam-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          border: 1px solid #e2e8f0;
        }
        .exam-content .question-nav {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 8px;
        }
        .exam-content .question-nav .el-button {
          width: 32px;
          height: 32px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
        }
        .exam-content .question-nav .el-button + .el-button {
          margin-left: 0;
        }
        .exam-content .question-nav .current-question {
          background-color: #4299e1 !important;
          color: white !important;
          border-color: #4299e1 !important;
        }
        .exam-content .exam-result {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .exam-content .result-container {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 20px;
        }
        .exam-content .result-left {
          background: #fff;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          border: 1px solid #e2e8f0;
        }
        .exam-content .result-header {
          text-align: center;
          margin-bottom: 24px;
        }
        .exam-content .result-header h2 {
          font-size: 20px;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 16px;
        }
        .exam-content .result-score {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .exam-content .score-circle {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: white;
          margin: 0 auto;
        }
        .exam-content .score-value {
          font-size: 36px;
          font-weight: 700;
          line-height: 1;
        }
        .exam-content .score-total {
          font-size: 18px;
          opacity: 0.9;
        }
        .exam-content .score-percent {
          font-size: 24px;
          font-weight: 600;
          color: #4299e1;
        }
        .exam-content .result-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .exam-content .stat-item {
          text-align: center;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 8px;
        }
        .exam-content .stat-value {
          font-size: 24px;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 4px;
        }
        .exam-content .stat-label {
          font-size: 14px;
          color: #718096;
        }
        .exam-content .result-actions {
          display: flex;
          justify-content: center;
        }
        .exam-content .result-right {
          background: #fff;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          border: 1px solid #e2e8f0;
        }
        .exam-content .result-details {
          max-height: 600px;
          overflow-y: auto;
        }
        .exam-content .details-title {
          text-align: center;
          font-size: 18px;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 16px;
        }
        .exam-content .question-number-list {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 8px;
          justify-items: center;
        }
        .exam-content .question-number-btn {
          width: 32px;
          height: 32px;
          padding: 0;
          font-size: 13px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 8px;
          box-sizing: border-box;
        }
        
        @media (max-width: 768px) {
          .exam-content {
            padding: 16px;
          }
          .exam-content .config-form {
            grid-template-columns: 1fr;
          }
          .exam-content .exam-actions {
            flex-direction: column;
          }
          .exam-content .preview-header {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
          }
          .exam-content .preview-meta {
            flex-direction: column;
            gap: 8px;
          }
          .exam-content .preview-actions {
            flex-direction: column;
          }
          .exam-content .result-container {
            grid-template-columns: 1fr;
          }
          .exam-content .exam-footer {
            flex-direction: column;
            gap: 12px;
          }
          .exam-content .question-nav {
            max-width: 100%;
          }
        }
      `;
      document.head.appendChild(style);
    }
    // 页面加载完成
  }
});