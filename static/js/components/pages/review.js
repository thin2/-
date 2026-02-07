/**
 * 复习中心页面组件
 */
Vue.component('app-review', {
  template: `
    <div class="review-content">
      <h2 class="page-title">复习中心</h2>

      <!-- 复习模式选择 -->
      <div class="review-modes">
        <div class="mode-card" @click="startReview('random')">
          <div class="mode-icon icon-blue">
            <i class="fas fa-random"></i>
          </div>
          <div class="mode-title">随机复习</div>
          <div class="mode-desc">随机抽取错题进行复习</div>
        </div>
        <div class="mode-card" @click="startReview('difficulty')">
          <div class="mode-icon icon-orange">
            <i class="fas fa-signal"></i>
          </div>
          <div class="mode-title">按难度复习</div>
          <div class="mode-desc">从简单到困难逐步复习</div>
        </div>
        <div class="mode-card" @click="startReview('review')">
          <div class="mode-icon icon-red">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <div class="mode-title">重点复习</div>
          <div class="mode-desc">复习标记为重点的错题</div>
        </div>
      </div>

      <!-- 筛选区域 -->
      <div class="filter-bar">
        <div class="filter-form">
          <el-select
            v-model="reviewFilters.subject_id"
            placeholder="选择科目"
            clearable
            size="small"
            style="width: 200px"
          >
            <el-option label="全部科目" :value="''"></el-option>
            <el-option
              v-for="subject in subjects"
              :key="subject.id"
              :label="subject.name"
              :value="subject.id"
            ></el-option>
          </el-select>
          <el-select
            v-model="reviewFilters.difficulty"
            placeholder="选择难度"
            clearable
            size="small"
            style="width: 160px"
          >
            <el-option
              v-for="item in difficultyOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
          <el-button type="primary" size="small" icon="el-icon-search" @click="handleSearch">搜索</el-button>
          <el-button size="small" icon="el-icon-refresh-left" @click="resetSearch">重置</el-button>
        </div>
      </div>

      <!-- 待复习列表 -->
      <div class="table-container">
        <div class="table-header">
          <div class="table-title">待复习错题</div>
          <el-button type="primary" @click="batchReview">批量复习</el-button>
        </div>
        <el-table
          :data="reviewList"
          border
          style="width: 100%;"
          @selection-change="handleSelectionChange"
          v-loading="listLoading"
        >
          <el-table-column type="selection" width="55"></el-table-column>
          <el-table-column prop="title" label="题目" min-width="250"></el-table-column>
          <el-table-column prop="subject" label="科目" width="120" align="center"></el-table-column>
          <el-table-column prop="difficulty" label="难度" width="100" align="center">
            <template slot-scope="scope">
              <el-tag :type="scope.row.difficulty === '简单' ? 'success' : scope.row.difficulty === '中等' ? 'warning' : 'danger'" size="small">
                {{ scope.row.difficulty }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="lastReviewTime" label="上次复习" width="180" align="center"></el-table-column>
          <el-table-column prop="reviewCount" label="复习次数" width="100" align="center"></el-table-column>
          <el-table-column label="操作" width="150" align="center">
            <template slot-scope="scope">
              <el-button type="text" size="mini" style="color: #4299e1;" @click="startSingleReview(scope.row)">开始复习</el-button>
            </template>
          </el-table-column>
        </el-table>
        <!-- 分页组件 -->
        <div class="pagination-container" style="margin-top: 20px; text-align: right;">
          <el-pagination
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            :current-page="currentPage"
            :page-sizes="[10, 20, 50, 100]"
            :page-size="pageSize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
          ></el-pagination>
        </div>
      </div>

      <!-- 选择科目/难度弹窗 -->
      <el-dialog 
        :title="selectDialogTitle" 
        :visible.sync="selectDialogVisible" 
        width="400px"
        :close-on-click-modal="false"
      >
        <div v-if="pendingReviewMode === 'subject'">
          <el-select
            v-model="selectedSubjectId"
            placeholder="请选择科目"
            style="width: 100%"
            size="medium"
          >
            <el-option
              v-for="subject in subjects"
              :key="subject.id"
              :label="subject.name"
              :value="subject.id"
            ></el-option>
          </el-select>
        </div>
        <div v-else-if="pendingReviewMode === 'difficulty'">
          <el-select
            v-model="selectedDifficulty"
            placeholder="请选择难度"
            style="width: 100%"
            size="medium"
          >
            <el-option
              v-for="item in difficultyOptions.filter(d => d.value !== '')"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
        </div>
        <span slot="footer" class="dialog-footer">
          <el-button @click="selectDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmReviewSelection">开始复习</el-button>
        </span>
      </el-dialog>

      <!-- 复习弹窗 -->
      <el-dialog title="复习错题" :visible.sync="reviewDialogVisible" width="900px" :close-on-click-modal="false">
        <div class="review-dialog-content" v-if="currentQuestion">
          <div class="question-section">
            <h3>题目</h3>
            <div class="question-content">{{ currentQuestion.content || currentQuestion.title }}</div>
          </div>
          <div class="answer-section" v-show="showAnswer">
            <h3>正确答案</h3>
            <div class="answer-content">{{ currentQuestion.answer }}</div>
          </div>
          <div class="error-section">
            <h3>错误原因</h3>
            <div class="error-content">{{ currentQuestion.errorReason }}</div>
          </div>
          <div class="review-actions">
            <el-button @click="markAsForgot">忘记了</el-button>
            <el-button type="warning" @click="markAsHard">有点难</el-button>
            <el-button type="success" @click="markAsMastered">已掌握</el-button>
          </div>
        </div>
        <span slot="footer" class="dialog-footer">
          <el-button @click="showAnswer = true" v-if="!showAnswer">查看答案</el-button>
          <el-button v-if="isBatchReview && reviewQueue.length > 1" @click="nextQuestion">下一题</el-button>
          <el-button v-if="isBatchReview" @click="reviewDialogVisible = false">结束复习</el-button>
        </span>
      </el-dialog>
    </div>
  `,
  data() {
    return {
      loading: false,
      reviewStats: {
        todayCount: 0,
        pendingCount: 0,
        reviewedCount: 0,
        streakDays: 0
      },
      reviewFilters: {
        subject_id: '',
        difficulty: ''
      },
      subjects: [],
      reviewList: [],
      selectedItems: [],
      reviewDialogVisible: false,
      currentQuestion: null,
      showAnswer: false,
      reviewQueue: [],
      currentQueueIndex: 0,
      isBatchReview: false,
      listLoading: false,
      // 分页相关
      currentPage: 1,
      pageSize: 10,
      total: 0,
      // 选择弹窗相关
      selectDialogVisible: false,
      pendingReviewMode: '',
      selectedSubjectId: null,
      selectedDifficulty: null
    };
  },
  computed: {
    difficultyOptions() {
      return [
        { label: '全部', value: '' },
        { label: '简单', value: 1 },
        { label: '中等', value: 2 },
        { label: '困难', value: 3 }
      ];
    },
    selectDialogTitle() {
      if (this.pendingReviewMode === 'subject') {
        return '选择科目';
      } else if (this.pendingReviewMode === 'difficulty') {
        return '选择难度';
      }
      return '选择';
    }
  },
  methods: {
    async fetchReviewStats() {
      try {
        const res = await reviewAPI.stats();
        const data = res.data || {};
        this.reviewStats = {
          todayCount: data.today_count || 0,
          pendingCount: data.pending_count || 0,
          reviewedCount: data.reviewed_count || 0,
          streakDays: data.streak_days || 0
        };
      } catch (error) {
        console.error(error);
      }
    },
    async fetchSubjects() {
      try {
        const res = await subjectAPI.list();
        this.subjects = Array.isArray(res.data) ? res.data : [];
      } catch (error) {
        console.error('获取科目失败', error);
      }
    },
    async fetchReviewList(extraParams = {}) {
      this.listLoading = true;
      try {
        const params = {
          mode: 'pending',
          page: this.currentPage,
          page_size: this.pageSize,
          ...extraParams
        };
        // 如果 extraParams 中没有覆盖分页参数，使用当前的筛选条件
        if (!extraParams.page && !extraParams.page_size) {
          if (!extraParams.subject_id && this.reviewFilters.subject_id) {
            params.subject_id = this.reviewFilters.subject_id;
          }
          if (!extraParams.difficulty && this.reviewFilters.difficulty) {
            params.difficulty = this.reviewFilters.difficulty;
          }
        }
        const res = await reviewAPI.list(params);
        
        // 处理响应数据：可能是新格式（带分页信息）或旧格式（直接数组）
        if (res.data && typeof res.data === 'object' && 'list' in res.data) {
          // 新格式：包含分页信息
          this.reviewList = (res.data.list || []).map(this.normalizeQuestion);
          this.total = res.data.total || 0;
          this.currentPage = res.data.page || this.currentPage;
          this.pageSize = res.data.page_size || this.pageSize;
        } else {
          // 旧格式：直接是数组（兼容复习模式的 limit 参数）
          const list = Array.isArray(res.data) ? res.data : [];
          this.reviewList = list.map(this.normalizeQuestion);
          this.total = list.length;
        }
      } catch (error) {
        console.error('获取复习列表失败', error);
        this.$message.error('获取复习列表失败');
      } finally {
        this.listLoading = false;
      }
    },
    normalizeQuestion(item) {
      const difficultyMap = { 1: '简单', 2: '中等', 3: '困难' };
      return {
        id: item.id,
        title: item.title,
        subject: item.subject_name || '未分类',
        difficulty: difficultyMap[item.difficulty] || '中等',
        difficultyValue: item.difficulty,
        lastReviewTime: item.last_review_at || '-',
        reviewCount: item.review_count || 0,
        content: item.content,
        answer: item.answer,
        errorReason: item.error_reason || '',
      };
    },
    async startReview(mode) {
      // 如果需要选择科目或难度，先显示选择弹窗
      if (mode === 'subject') {
        this.pendingReviewMode = 'subject';
        this.selectedSubjectId = null;
        this.selectDialogVisible = true;
        return;
      }
      if (mode === 'difficulty') {
        this.pendingReviewMode = 'difficulty';
        this.selectedDifficulty = null;
        this.selectDialogVisible = true;
        return;
      }
      
      // 其他模式直接开始复习
      await this.doStartReview(mode, null, null);
    },
    async confirmReviewSelection() {
      if (this.pendingReviewMode === 'subject' && !this.selectedSubjectId) {
        this.$message.warning('请选择科目');
        return;
      }
      if (this.pendingReviewMode === 'difficulty' && !this.selectedDifficulty) {
        this.$message.warning('请选择难度');
        return;
      }
      
      this.selectDialogVisible = false;
      await this.doStartReview(
        this.pendingReviewMode,
        this.selectedSubjectId,
        this.selectedDifficulty
      );
    },
    async doStartReview(mode, subjectId, difficulty) {
      const params = { mode, limit: 20 };
      if (mode === 'subject' && subjectId) {
        params.subject_id = subjectId;
      }
      if (mode === 'difficulty' && difficulty) {
        params.difficulty = difficulty;
      }
      if (mode === 'review') {
        params.mode = 'important';
      }

      try {
        const res = await reviewAPI.list(params);
        const list = (res.data || []).map(this.normalizeQuestion);
        if (list.length === 0) {
          this.$message.info('没有可复习的题目');
          return;
        }
        this.reviewQueue = list;
        this.currentQueueIndex = 0;
        this.openReviewDialog(list[0]);
      } catch (error) {
        console.error(error);
        this.$message.error('获取复习题目失败');
      }
    },
    openReviewDialog(question) {
      this.currentQuestion = { ...question };
      this.reviewDialogVisible = true;
      this.showAnswer = false;
    },
    startSingleReview(row) {
      this.isBatchReview = false;
      this.reviewQueue = [row];
      this.currentQueueIndex = 0;
      this.openReviewDialog(row);
    },
    batchReview() {
      if (this.selectedItems.length === 0) {
        this.$message.warning('请选择要复习的错题');
        return;
      }
      this.isBatchReview = true;
      this.reviewQueue = [...this.selectedItems];
      this.currentQueueIndex = 0;
      this.openReviewDialog(this.reviewQueue[0]);
    },
    nextQuestion() {
      if (!this.reviewQueue.length) {
        this.reviewDialogVisible = false;
        return;
      }
      if (this.currentQueueIndex < this.reviewQueue.length - 1) {
        this.currentQueueIndex += 1;
        this.currentQuestion = { ...this.reviewQueue[this.currentQueueIndex] };
        this.showAnswer = false;
        return;
      }
      // 复习完成，静默关闭弹窗
      this.reviewDialogVisible = false;
      this.reviewQueue = [];
    },
    async submitReviewResult(result) {
      if (!this.currentQuestion) return;
      try {
        const res = await reviewAPI.submit(this.currentQuestion.id, { result });
        // 静默记录复习结果，不弹出消息提示
        // 已掌握的错题不再删除，只更新掌握状态
        
        // 更新当前题目的掌握状态
        if (this.currentQuestion) {
          this.currentQuestion.mastery_status = result;
        }
        
        // 如果标记为"已掌握"，从待复习列表中移除（因为待复习列表只显示 review_status=0 的题目）
        if (result === 'mastered') {
          const questionId = this.currentQuestion.id;
          
          // 从待复习列表中移除
          this.reviewList = this.reviewList.filter(q => q.id !== questionId);
          // 如果总数有变化，也需要更新总数
          if (this.total > 0) {
            this.total -= 1;
          }
          
          // 从复习队列中移除已掌握的题目
          const removedIndex = this.reviewQueue.findIndex(q => q.id === questionId);
          if (removedIndex !== -1) {
            this.reviewQueue.splice(removedIndex, 1);
            // 如果移除的题目在当前题目之前，需要调整索引
            if (removedIndex < this.currentQueueIndex) {
              this.currentQueueIndex -= 1;
            }
            // 如果移除后队列为空，直接关闭弹窗
            if (this.reviewQueue.length === 0) {
        this.reviewDialogVisible = false;
              await this.fetchReviewStats();
              return;
            }
            // 如果当前索引超出队列长度，调整到最后一个
            if (this.currentQueueIndex >= this.reviewQueue.length) {
              this.currentQueueIndex = this.reviewQueue.length - 1;
            }
          }
        }
        
        await this.fetchReviewStats();
        this.nextQuestion();
      } catch (error) {
        console.error(error);
      }
    },
    markAsForgot() {
      this.submitReviewResult('forgot');
    },
    markAsHard() {
      this.submitReviewResult('hard');
    },
    markAsMastered() {
      this.submitReviewResult('mastered');
    },
    handleSelectionChange(val) {
      this.selectedItems = val;
    },
    handleSearch() {
      // 搜索时重置到第一页
      this.currentPage = 1;
      this.fetchReviewList();
    },
    resetSearch() {
      // 重置筛选条件
      this.reviewFilters.subject_id = '';
      this.reviewFilters.difficulty = '';
      // 重置到第一页并刷新列表
      this.currentPage = 1;
      this.fetchReviewList();
    },
    // 分页相关方法
    handleSizeChange(val) {
      this.pageSize = val;
      this.currentPage = 1;
      this.fetchReviewList();
    },
    handleCurrentChange(val) {
      this.currentPage = val;
      this.fetchReviewList();
    }
  },
  async mounted() {
    await this.fetchSubjects();
    await Promise.all([this.fetchReviewStats(), this.fetchReviewList()]);
    if (!document.getElementById('review-styles')) {
      const style = document.createElement('style');
      style.id = 'review-styles';
      style.textContent = `
        .review-content {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
        }
        .filter-bar {
          background: #fff;
          border-radius: 8px;
          padding: 16px 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          margin-bottom: 20px;
        }
        .filter-form {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          align-items: center;
        }
        .page-title {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 24px;
          color: #2d3748;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .page-title::before {
          content: '';
          width: 4px;
          height: 28px;
          background-color: #4299e1;
          border-radius: 2px;
        }
        .stat-cards {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
          margin-bottom: 30px;
        }
        .stat-card {
          flex: 1;
          min-width: 200px;
          background: #fff;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .card-icon {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }
        .icon-blue { background: #e8f4f8; color: #4299e1; }
        .icon-green { background: #eaf6fa; color: #38b2ac; }
        .icon-orange { background: #fef7fb; color: #ed8936; }
        .icon-purple { background: #faf0f5; color: #9f7aea; }
        .icon-red { background: #fee; color: #e53e3e; }
        .card-value {
          font-size: 24px;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 4px;
        }
        .card-label {
          font-size: 14px;
          color: #718096;
        }
        .review-modes {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        .mode-card {
          background: #fff;
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          text-align: center;
          cursor: pointer;
          transition: all 0.3s;
        }
        .mode-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .mode-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          margin: 0 auto 16px;
        }
        .table-container {
          background: #fff;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        .table-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        .review-dialog-content {
          padding: 20px 0;
        }
        .question-section, .answer-section, .error-section {
          margin-bottom: 24px;
        }
        .question-content, .answer-content, .error-content {
          background: #f7fafc;
          border-radius: 6px;
          padding: 16px;
          line-height: 1.6;
          color: #4a5568;
        }
        .review-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-top: 24px;
        }
      `;
      document.head.appendChild(style);
    }
  }
});

