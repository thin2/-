/**
 * 错题列表页面组件
 */
Vue.component('app-question-list', {
  template: `
    <div class="question-list-content">
      <h2 class="page-title">错题列表</h2>

      <!-- 搜索筛选区 -->
      <div class="search-container">
        <el-form :inline="true" class="search-form" size="small">
          <div class="search-row">
            <el-form-item label="题目名称：">
              <el-input v-model="searchForm.title" placeholder="请输入题目名称" style="width: 180px;" clearable size="small"></el-input>
            </el-form-item>
            <el-form-item label="难度：">
              <el-select v-model="searchForm.difficulty" placeholder="请选择难度" style="width: 120px;" clearable size="small">
                <el-option label="全部" value=""></el-option>
                <el-option label="简单" value="简单"></el-option>
                <el-option label="中等" value="中等"></el-option>
                <el-option label="困难" value="困难"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="添加时间：">
              <el-date-picker
                v-model="searchForm.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                style="width: 320px;"
                size="small"
              ></el-date-picker>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="el-icon-search" @click="handleSearch" size="small">搜索</el-button>
              <el-button icon="el-icon-refresh" @click="resetSearch" size="small">重置</el-button>
            </el-form-item>
          </div>
        </el-form>
      </div>

      <!-- 表格区域 -->
      <div class="table-container">
        <div class="table-header">
          <div class="table-title">错题数据列表</div>
          <el-button type="primary" icon="el-icon-plus" @click="showAddDialog" size="small">添加错题</el-button>
        </div>
        <el-table 
          :data="questionList" 
          border 
          style="width: 100%;"
          v-loading="loading"
          size="small"
        >
          <el-table-column prop="title" label="题目名称" min-width="200">
            <template slot-scope="scope">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span>{{ scope.row.title }}</span>
                <i v-if="scope.row.hasImages" class="el-icon-picture" style="color: #409EFF; font-size: 16px;" title="包含图片"></i>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="subject" label="科目" width="120" align="center"></el-table-column>
          <el-table-column prop="difficulty" label="难度" width="100" align="center">
            <template slot-scope="scope">
              <el-tag :type="scope.row.difficulty === '简单' ? 'success' : scope.row.difficulty === '中等' ? 'warning' : 'danger'" size="small">
                {{ scope.row.difficulty }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="errorReason" label="错误原因" min-width="220"></el-table-column>
          <el-table-column prop="addTime" label="添加时间" width="180" align="center"></el-table-column>
          <el-table-column prop="reviewStatus" label="复习状态" width="120" align="center">
            <template slot-scope="scope">
              <el-tag :type="scope.row.reviewStatus === '已复习' ? 'success' : 'info'" size="small">
                {{ scope.row.reviewStatus }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="masteryStatus" label="掌握状态" width="120" align="center">
            <template slot-scope="scope">
              <el-tag 
                v-if="scope.row.masteryStatus" 
                :type="scope.row.masteryStatus === 'mastered' ? 'success' : scope.row.masteryStatus === 'hard' ? 'warning' : 'danger'"
                size="small"
              >
                {{ getMasteryStatusLabel(scope.row.masteryStatus) }}
              </el-tag>
              <span v-else style="color: #909399;">未复习</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" align="center" fixed="right">
            <template slot-scope="scope">
              <el-button type="text" size="mini" style="color: #4299e1;" @click="viewDetail(scope.row)">查看</el-button>
              <el-button type="text" size="mini" style="color: #48bb78;" @click="editQuestion(scope.row)">编辑</el-button>
              <el-button type="text" size="mini" style="color: #e53e3e;" @click="deleteQuestion(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            :current-page="currentPage"
            :page-sizes="[10, 20, 50, 100]"
            :page-size="pageSize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            small
          ></el-pagination>
        </div>
      </div>

      <!-- 添加错题弹窗 -->
      <el-dialog :title="dialogTitle" :visible.sync="addDialogVisible" width="780px" @close="resetAddForm">
        <el-form :model="addForm" :rules="addRules" ref="addForm" label-width="100px" size="small">
          <el-form-item label="题目名称" prop="title">
            <el-input v-model="addForm.title" placeholder="请输入题目名称" size="small"></el-input>
          </el-form-item>
          <el-form-item label="题目类型" prop="questionType">
            <el-select v-model="addForm.questionType" placeholder="请选择题目类型" size="small" style="width: 100%;">
              <el-option label="单选题" value="single_choice"></el-option>
              <el-option label="多选题" value="multiple_choice"></el-option>
              <el-option label="判断题" value="true_false"></el-option>
              <el-option label="填空题" value="fill_blank"></el-option>
              <el-option label="简答题" value="short_answer"></el-option>
              <el-option label="解答题" value="essay"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="难度" prop="difficulty">
            <el-radio-group v-model="addForm.difficulty" size="small">
              <el-radio label="简单">简单</el-radio>
              <el-radio label="中等">中等</el-radio>
              <el-radio label="困难">困难</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="题目内容" prop="content">
            <el-input type="textarea" :rows="4" v-model="addForm.content" placeholder="请输入题目内容"></el-input>
          </el-form-item>
          <el-form-item label="错误原因" prop="errorReason">
            <el-input type="textarea" :rows="3" v-model="addForm.errorReason" placeholder="请描述错误原因"></el-input>
            <div style="margin-top: 8px;">
              <el-upload
                :action="''"
                :auto-upload="false"
                :on-change="(file, fileList) => handleErrorImageChange(file, fileList, 'error')"
                :file-list="addForm.errorImageList"
                :limit="3"
                :on-preview="handleImagePreview"
                :on-remove="(file, fileList) => handleErrorImageRemove(file, fileList, 'error')"
                accept="image/*,.pdf,.doc,.docx"
              >
                <el-button size="small" type="primary" icon="el-icon-upload2">点击上传</el-button>
                <div slot="tip" class="el-upload__tip">
                  支持图片、PDF、Word文档，单个文件不超过10MB，最多3个
                </div>
              </el-upload>
            </div>
          </el-form-item>
          <el-form-item label="正确答案" prop="answer">
            <el-input type="textarea" :rows="3" v-model="addForm.answer" placeholder="请输入正确答案"></el-input>
            <div style="margin-top: 8px;">
              <el-upload
                :action="''"
                :auto-upload="false"
                :on-change="(file, fileList) => handleErrorImageChange(file, fileList, 'answer')"
                :file-list="addForm.answerImageList"
                :limit="3"
                :on-preview="handleImagePreview"
                :on-remove="(file, fileList) => handleErrorImageRemove(file, fileList, 'answer')"
                accept="image/*,.pdf,.doc,.docx"
              >
                <el-button size="small" type="primary" icon="el-icon-upload2">点击上传</el-button>
                <div slot="tip" class="el-upload__tip">
                  支持图片、PDF、Word文档，单个文件不超过10MB，最多3个
                </div>
              </el-upload>
            </div>
          </el-form-item>
        </el-form>
        
        <span slot="footer" class="dialog-footer">
          <el-button @click="addDialogVisible = false" size="small">取消</el-button>
          <el-button type="primary" @click="handleAddSubmit" size="small">确定</el-button>
        </span>
      </el-dialog>

      <!-- 图片预览对话框（独立于添加/编辑弹窗，避免嵌套导致黑屏） -->
      <el-dialog :visible.sync="imagePreviewVisible" width="800px">
        <img :src="previewImageUrl" style="width: 100%;" alt="预览图片" />
      </el-dialog>

      <!-- 查看错题详情弹窗 -->
      <el-dialog title="错题详情" :visible.sync="detailDialogVisible" width="900px" :close-on-click-modal="false">
        <div class="question-detail-content" v-if="questionDetail">
          <!-- 基本信息 -->
          <div class="detail-section">
            <div class="detail-header">
              <h3>基本信息</h3>
            </div>
            <div class="detail-info-grid">
              <div class="info-item">
                <span class="info-label">题目名称：</span>
                <span class="info-value">{{ questionDetail.title }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">科目：</span>
                <el-tag :color="questionDetail.subject_color" style="color: #fff; border: none;" size="small">
                  {{ questionDetail.subject_name }}
                </el-tag>
              </div>
              <div class="info-item">
                <span class="info-label">题目类型：</span>
                <el-tag type="info" size="small">{{ getQuestionTypeLabel(questionDetail.question_type) }}</el-tag>
              </div>
              <div class="info-item">
                <span class="info-label">难度：</span>
                <el-tag :type="questionDetail.difficulty === 1 ? 'success' : questionDetail.difficulty === 2 ? 'warning' : 'danger'" size="small">
                  {{ getDifficultyLabel(questionDetail.difficulty) }}
                </el-tag>
              </div>
              <div class="info-item">
                <span class="info-label">添加时间：</span>
                <span class="info-value">{{ questionDetail.created_at }}</span>
              </div>
              <div class="info-item" v-if="questionDetail.review_count !== undefined">
                <span class="info-label">复习次数：</span>
                <span class="info-value">{{ questionDetail.review_count }} 次</span>
              </div>
              <div class="info-item" v-if="questionDetail.last_review_at">
                <span class="info-label">上次复习：</span>
                <span class="info-value">{{ questionDetail.last_review_at }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">状态：</span>
                <el-tag v-if="questionDetail.is_important" type="warning" style="margin-right: 8px;" size="small">重点</el-tag>
                <el-tag 
                  v-if="questionDetail.mastery_status" 
                  :type="questionDetail.mastery_status === 'mastered' ? 'success' : questionDetail.mastery_status === 'hard' ? 'warning' : 'danger'"
                  style="margin-right: 8px;"
                  size="small"
                >
                  {{ getMasteryStatusLabel(questionDetail.mastery_status) }}
                </el-tag>
                <span v-if="!questionDetail.is_important && !questionDetail.mastery_status">未复习</span>
              </div>
            </div>
          </div>

          <!-- 标签 -->
          <div class="detail-section" v-if="questionDetail.tags && questionDetail.tags.length > 0">
            <div class="detail-header">
              <h3>标签</h3>
            </div>
            <div class="tags-container">
              <el-tag v-for="tag in questionDetail.tags" :key="tag" style="margin-right: 8px; margin-bottom: 8px;" size="small">
                {{ tag }}
              </el-tag>
            </div>
          </div>

          <!-- 题目内容 -->
          <div class="detail-section">
            <div class="detail-header">
              <h3>题目内容</h3>
            </div>
            <div class="detail-content-text">{{ questionDetail.content || questionDetail.title }}</div>
          </div>

          <!-- 正确答案 -->
          <div class="detail-section">
            <div class="detail-header">
              <h3>正确答案</h3>
            </div>
            <div class="detail-content-text answer-text">{{ questionDetail.answer }}</div>
          </div>

          <!-- 错误原因 -->
          <div class="detail-section">
            <div class="detail-header">
              <h3>错误原因</h3>
            </div>
            <div class="detail-content-text error-text">{{ questionDetail.error_reason }}</div>
          </div>

          <!-- 错题图片 -->
          <div class="detail-section" v-if="questionDetail.images && questionDetail.images.length > 0">
            <div class="detail-header">
              <h3>错题图片（{{ questionDetail.images.length }}张）</h3>
            </div>
            <div class="images-container">
              <div 
                v-for="(imageUrl, index) in questionDetail.images" 
                :key="index"
                class="image-item"
                @click="previewDetailImage(imageUrl)"
              >
                <img :src="imageUrl" :alt="'错题图片' + (index + 1)" />
              </div>
            </div>
          </div>
        </div>
      </el-dialog>

    </div>
  `,
  data() {
    return {
      loading: false,
      searchForm: {
        title: '',
        subjectId: '',
        difficulty: '',
        dateRange: []
      },
      subjects: [],
      addDialogVisible: false,
      addForm: {
        title: '',
        questionType: 'single_choice',
        subjectId: '',
        difficulty: '中等',
        content: '',
        errorReason: '',
        answer: '',
        images: [],
        imageList: [],
        errorImageList: [],
        answerImageList: [],
        errorImages: [],
        answerImages: []
      },
      imagePreviewVisible: false,
      previewImageUrl: '',
      // 详情弹窗
      detailDialogVisible: false,
      questionDetail: null,
      addRules: {
        title: [{ required: true, message: '请输入题目名称', trigger: 'blur' }],
        questionType: [{ required: true, message: '请选择题目类型', trigger: 'change' }],
        difficulty: [{ required: true, message: '请选择难度', trigger: 'change' }],
        content: [{ required: true, message: '请输入题目内容', trigger: 'blur' }],
        errorReason: [{ required: true, message: '请输入错误原因', trigger: 'blur' }]
      },
      questionList: [],
      currentPage: 1,
      pageSize: 10,
      total: 0,
      dialogTitle: '添加错题',
      editingId: null
    };
  },
  methods: {
    async fetchSubjects() {
      try {
        const res = await subjectAPI.list();
        this.subjects = Array.isArray(res.data) ? res.data : [];
      } catch (error) {
        console.error(error);
      }
    },
    async fetchQuestions() {
      this.loading = true;
      try {
        const params = {
          page: this.currentPage,
          page_size: this.pageSize
        };
        if (this.searchForm.title) {
          params.keyword = this.searchForm.title;
        }
        if (this.searchForm.subjectId) {
          params.subject_id = this.searchForm.subjectId;
        }
        if (this.searchForm.difficulty) {
          const diffMap = { '简单': 1, '中等': 2, '困难': 3 };
          params.difficulty = diffMap[this.searchForm.difficulty] || 0;
        }
        if (this.searchForm.dateRange && this.searchForm.dateRange.length === 2) {
          params.start_date = this.searchForm.dateRange[0];
          params.end_date = this.searchForm.dateRange[1];
        }

        const res = await questionAPI.listQuestions(params);
        const data = res.data || {};
        const list = Array.isArray(data.list) ? data.list : [];
        const diffReverseMap = { 1: '简单', 2: '中等', 3: '困难' };

        this.questionList = list.map(item => {
          const diff = diffReverseMap[item.difficulty] || '中等';
          const reviewStatus = item.review_status === 1 ? '已复习' : '未复习';
          return {
            id: item.id,
            title: item.title,
            subject: item.subject_name,
            difficulty: diff,
            errorReason: item.error_reason,
            addTime: item.created_at,
            reviewStatus: reviewStatus,
            masteryStatus: item.mastery_status || null,
            hasImages: item.images && item.images.length > 0
          };
        });
        this.total = data.total || 0;
        this.currentPage = data.page || this.currentPage;
        this.pageSize = data.page_size || this.pageSize;
      } catch (error) {
        console.error('获取错题列表失败', error);
      } finally {
        this.loading = false;
      }
    },
    handleSearch() {
      this.currentPage = 1;
      this.fetchQuestions();
    },
    resetSearch() {
      this.searchForm = {
        title: '',
        subjectId: '',
        difficulty: '',
        dateRange: []
      };
      this.currentPage = 1;
      this.fetchQuestions();
    },
    showAddDialog() {
      this.dialogTitle = '添加错题';
      this.editingId = null;
      this.resetAddForm();
      this.addDialogVisible = true;
    },
    async handleImageChange(file, fileList) {
      // 限制文件大小和数量
      if (file.size > 5 * 1024 * 1024) {
        this.$message.error('图片大小不能超过 5MB');
        // 从fileList中移除
        const index = fileList.findIndex(f => f.uid === file.uid);
        if (index > -1) {
          fileList.splice(index, 1);
          this.addForm.imageList = fileList;
        }
        return;
      }
      if (fileList.length > 5) {
        this.$message.error('最多只能上传 5 张图片');
        // 移除最后一张
        fileList.pop();
        this.addForm.imageList = fileList;
        return;
      }
      
      // 上传图片
      try {
        this.$message.info('正在上传图片...');
        const res = await questionAPI.uploadImage(file.raw);
        if (res.code === 0 && res.data && res.data.url) {
          // 将上传成功的URL添加到images数组
          if (!this.addForm.images) {
            this.addForm.images = [];
          }
          this.addForm.images.push(res.data.url);
          
          // 更新file对象，添加URL和response
          const fileIndex = fileList.findIndex(f => f.uid === file.uid);
          if (fileIndex > -1) {
            fileList[fileIndex].url = res.data.url;
            fileList[fileIndex].response = res;
            fileList[fileIndex].status = 'success';
          }
          this.addForm.imageList = fileList;
          this.$message.success('图片上传成功');
        } else {
          this.$message.error(res.message || '图片上传失败');
          // 从fileList中移除失败的图片
          const index = fileList.findIndex(f => f.uid === file.uid);
          if (index > -1) {
            fileList.splice(index, 1);
            this.addForm.imageList = fileList;
          }
        }
      } catch (error) {
        this.$message.error('图片上传失败: ' + (error.message || '未知错误'));
        // 从fileList中移除失败的图片
        const index = fileList.findIndex(f => f.uid === file.uid);
        if (index > -1) {
          fileList.splice(index, 1);
          this.addForm.imageList = fileList;
        }
      }
    },
    handleImagePreview(file) {
      // 如果是已上传的图片，使用URL；否则使用本地预览
      if (file.url) {
        this.previewImageUrl = file.url;
      } else if (file.response && file.response.data && file.response.data.url) {
        this.previewImageUrl = file.response.data.url;
      } else {
        this.previewImageUrl = URL.createObjectURL(file.raw);
      }
      this.imagePreviewVisible = true;
    },
    handleImageRemove(file, fileList) {
      // 从images数组中移除对应的URL
      const imageUrl = file.url || (file.response && file.response.data && file.response.data.url);
      if (imageUrl && this.addForm.images) {
        const index = this.addForm.images.indexOf(imageUrl);
        if (index > -1) {
          this.addForm.images.splice(index, 1);
        }
      }
      // 更新imageList
      this.addForm.imageList = fileList;
    },
    async handleErrorImageChange(file, fileList, type) {
      // 限制文件大小和数量
      if (file.size > 10 * 1024 * 1024) {
        this.$message.error('文件大小不能超过 10MB');
        const index = fileList.findIndex(f => f.uid === file.uid);
        if (index > -1) {
          fileList.splice(index, 1);
          if (type === 'error') {
            this.addForm.errorImageList = fileList;
          } else {
            this.addForm.answerImageList = fileList;
          }
        }
        return;
      }
      if (fileList.length > 3) {
        this.$message.error('最多只能上传 3 个文件');
        fileList.pop();
        if (type === 'error') {
          this.addForm.errorImageList = fileList;
        } else {
          this.addForm.answerImageList = fileList;
        }
        return;
      }

      // 上传文件 - 使用通用上传接口支持PDF等文件
      try {
        this.$message.info('正在上传文件...');
        const res = await window.uploadAPI.uploadGeneralFile(file.raw);
        if (res.code === 0 && res.data && res.data.url) {
          // 根据类型添加到对应的数组
          if (type === 'error') {
            if (!this.addForm.errorImages) {
              this.addForm.errorImages = [];
            }
            this.addForm.errorImages.push(res.data.url);
            this.addForm.errorImageList = fileList;
          } else {
            if (!this.addForm.answerImages) {
              this.addForm.answerImages = [];
            }
            this.addForm.answerImages.push(res.data.url);
            this.addForm.answerImageList = fileList;
          }

          // 更新file对象
          const fileIndex = fileList.findIndex(f => f.uid === file.uid);
          if (fileIndex > -1) {
            fileList[fileIndex].url = res.data.url;
            fileList[fileIndex].response = res;
            fileList[fileIndex].status = 'success';
          }
          this.$message.success('文件上传成功');
        } else {
          this.$message.error(res.message || '文件上传失败');
          const index = fileList.findIndex(f => f.uid === file.uid);
          if (index > -1) {
            fileList.splice(index, 1);
            if (type === 'error') {
              this.addForm.errorImageList = fileList;
            } else {
              this.addForm.answerImageList = fileList;
            }
          }
        }
      } catch (error) {
        this.$message.error('文件上传失败: ' + (error.message || '未知错误'));
        const index = fileList.findIndex(f => f.uid === file.uid);
        if (index > -1) {
          fileList.splice(index, 1);
          if (type === 'error') {
            this.addForm.errorImageList = fileList;
          } else {
            this.addForm.answerImageList = fileList;
          }
        }
      }
    },
    handleErrorImageRemove(file, fileList, type) {
      const imageUrl = file.url || (file.response && file.response.data && file.response.data.url);
      if (type === 'error') {
        if (imageUrl && this.addForm.errorImages) {
          const index = this.addForm.errorImages.indexOf(imageUrl);
          if (index > -1) {
            this.addForm.errorImages.splice(index, 1);
          }
        }
        this.addForm.errorImageList = fileList;
      } else {
        if (imageUrl && this.addForm.answerImages) {
          const index = this.addForm.answerImages.indexOf(imageUrl);
          if (index > -1) {
            this.addForm.answerImages.splice(index, 1);
          }
        }
        this.addForm.answerImageList = fileList;
      }
    },
    handleAddSubmit() {
      this.$refs.addForm.validate(async (valid) => {
        if (!valid) {
          return;
        }
        const diffMap = { '简单': 1, '中等': 2, '困难': 3 };
        const payload = {
          title: this.addForm.title,
          subject_id: this.addForm.subjectId,
          difficulty: diffMap[this.addForm.difficulty] || 2,
          content: this.addForm.content,
          error_reason: this.addForm.errorReason,
          answer: this.addForm.answer,
          question_type: this.addForm.questionType || 'single_choice',
          images: this.addForm.images || [],
          error_images: this.addForm.errorImages || [],
          answer_images: this.addForm.answerImages || []
        };
        try {
          if (this.editingId) {
            await questionAPI.updateQuestion(this.editingId, payload);
            this.$message.success('更新成功');
          } else {
            await questionAPI.createQuestion(payload);
            this.$message.success('添加成功');
          }
          this.addDialogVisible = false;
          this.resetAddForm();
          this.fetchQuestions();
        } catch (error) {
          console.error('创建错题失败', error);
          this.$message.error('操作失败: ' + (error.message || '未知错误'));
        }
      });
    },
    resetAddForm() {
      if (this.$refs.addForm && this.$refs.addForm.resetFields) {
        this.$refs.addForm.resetFields();
      }
      this.editingId = null;
      this.addForm.images = [];
      this.addForm.imageList = [];
      this.addForm.errorImages = [];
      this.addForm.errorImageList = [];
      this.addForm.answerImages = [];
      this.addForm.answerImageList = [];
    },
    viewDetail(row) {
      questionAPI.getQuestionDetail(row.id).then(res => {
        this.questionDetail = res.data || {};
        this.detailDialogVisible = true;
      }).catch(() => {
        this.$message.error('获取错题详情失败');
      });
    },
    getQuestionTypeLabel(type) {
      const typeMap = {
        'single_choice': '单选题',
        'multiple_choice': '多选题',
        'true_false': '判断题',
        'fill_blank': '填空题',
        'short_answer': '简答题',
        'essay': '解答题'
      };
      return typeMap[type] || type;
    },
    getDifficultyLabel(difficulty) {
      const difficultyMap = {
        1: '简单',
        2: '中等',
        3: '困难'
      };
      return difficultyMap[difficulty] || '中等';
    },
    getMasteryStatusLabel(status) {
      const statusMap = {
        'forgot': '忘记了',
        'hard': '有点难',
        'mastered': '已掌握'
      };
      return statusMap[status] || status;
    },
    previewDetailImage(imageUrl) {
      this.previewImageUrl = imageUrl;
      this.imagePreviewVisible = true;
    },
    editQuestionFromDetail() {
      if (this.questionDetail) {
        this.detailDialogVisible = false;
        // 找到对应的行数据
        const row = this.questionList.find(q => q.id === this.questionDetail.id);
        if (row) {
          this.editQuestion(row);
        }
      }
    },
    editQuestion(row) {
      this.dialogTitle = '编辑错题';
      this.editingId = row.id;
      questionAPI.getQuestionDetail(row.id).then(res => {
        const data = res.data || {};
        const diffReverseMap = { 1: '简单', 2: '中等', 3: '困难' };
        const images = data.images || [];
        const errorImages = data.error_images || [];
        const answerImages = data.answer_images || [];
        this.addForm = {
          title: data.title || '',
          subjectId: data.subject_id || '',
          difficulty: diffReverseMap[data.difficulty] || '中等',
          content: data.content || '',
          errorReason: data.error_reason || '',
          answer: data.answer || '',
          questionType: data.question_type || 'single_choice',
          images: images,
          imageList: images.map((url, index) => ({
            uid: index,
            name: `image_${index + 1}`,
            url: url,
            status: 'success'
          })),
          errorImages: errorImages,
          errorImageList: errorImages.map((url, index) => ({
            uid: index,
            name: `error_image_${index + 1}`,
            url: url,
            status: 'success'
          })),
          answerImages: answerImages,
          answerImageList: answerImages.map((url, index) => ({
            uid: index,
            name: `answer_image_${index + 1}`,
            url: url,
            status: 'success'
          }))
        };
        this.addDialogVisible = true;
      }).catch(() => {});
    },
    deleteQuestion(row) {
      this.$confirm('确定要删除该错题吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await questionAPI.deleteQuestion(row.id);
          this.$message.success('删除成功');
          this.fetchQuestions();
        } catch (error) {
          console.error('删除错题失败', error);
        }
      }).catch(() => {});
    },
    handleSizeChange(val) {
      this.pageSize = val;
      this.currentPage = 1;
      this.fetchQuestions();
    },
    handleCurrentChange(val) {
      this.currentPage = val;
      this.fetchQuestions();
    }
  },
  mounted() {
    // 注入页面样式
    if (!document.getElementById('question-list-styles')) {
      const style = document.createElement('style');
      style.id = 'question-list-styles';
      style.textContent = `
        .question-list-content {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
          background-color: #f5f7fa;
        }
        .question-list-content .page-title {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 24px;
          color: #2d3748;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .question-list-content .page-title::before {
          content: '';
          width: 4px;
          height: 28px;
          background-color: #4299e1;
          border-radius: 2px;
        }
        .question-list-content .search-container {
          background: #fff;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          border: 1px solid #e2e8f0;
        }
        .question-list-content .question-filters {
          background: #fff;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          border: 1px solid #e2e8f0;
        }
        .question-list-content .table-container {
          background: #fff;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          border: 1px solid #e2e8f0;
        }
        .question-list-content .table-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .question-list-content .table-title {
          font-size: 16px;
          font-weight: 600;
          color: #2d3748;
        }
        .question-list-content .question-table-container {
          background: #fff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          border: 1px solid #e2e8f0;
        }
        .question-list-content .question-table {
          width: 100%;
          border-collapse: collapse;
        }
        .question-list-content .question-table th {
          background-color: #f8f9fa;
          padding: 12px 16px;
          text-align: left;
          font-weight: 600;
          color: #2d3748;
          border-bottom: 2px solid #e2e8f0;
        }
        .question-list-content .question-table td {
          padding: 16px;
          border-bottom: 1px solid #e2e8f0;
          vertical-align: top;
        }
        .question-list-content .question-table tr:hover {
          background-color: #f8f9fa;
        }
        .question-list-content .question-content {
          max-width: 400px;
          line-height: 1.6;
        }
        .question-list-content .question-title {
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 8px;
          display: block;
        }
        .question-list-content .question-meta {
          font-size: 12px;
          color: #718096;
          margin-bottom: 4px;
        }
        .question-list-content .question-text {
          color: #4a5568;
          font-size: 14px;
          line-height: 1.5;
        }
        .question-list-content .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }
        .question-list-content .status-pending {
          background-color: #fef7e0;
          color: #d69e2e;
        }
        .question-list-content .status-mastered {
          background-color: #e6fffa;
          color: #38b2ac;
        }
        .question-list-content .status-reviewing {
          background-color: #ebf8ff;
          color: #4299e1;
        }
        .question-list-content .difficulty-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 500;
          margin-right: 4px;
        }
        .question-list-content .difficulty-easy {
          background-color: #e6fffa;
          color: #38b2ac;
        }
        .question-list-content .difficulty-medium {
          background-color: #fef7e0;
          color: #d69e2e;
        }
        .question-list-content .difficulty-hard {
          background-color: #fed7d7;
          color: #e53e3e;
        }
        .question-list-content .action-buttons {
          display: flex;
          gap: 8px;
          justify-content: center;
        }
        .question-list-content .action-button {
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.2s;
        }
        .question-list-content .action-button:hover {
          transform: translateY(-1px);
        }
        .question-list-content .edit-button {
          background-color: #ebf8ff;
          color: #4299e1;
          border-color: #4299e1;
        }
        .question-list-content .edit-button:hover {
          background-color: #4299e1;
          color: white;
        }
        .question-list-content .delete-button {
          background-color: #fed7d7;
          color: #e53e3e;
          border-color: #e53e3e;
        }
        .question-list-content .delete-button:hover {
          background-color: #e53e3e;
          color: white;
        }
        .question-list-content .pagination-container {
          display: flex;
          justify-content: flex-end;
          margin-top: 20px;
        }
        .question-list-content .question-detail-content {
          max-height: 70vh;
          overflow-y: auto;
        }
        .question-list-content .detail-section {
          margin-bottom: 24px;
          padding-bottom: 24px;
          border-bottom: 1px solid #e2e8f0;
        }
        .question-list-content .detail-section:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }
        .question-list-content .detail-header {
          margin-bottom: 16px;
        }
        .question-list-content .detail-header h3 {
          font-size: 16px;
          font-weight: 600;
          color: #2d3748;
        }
        .question-list-content .detail-info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        .question-list-content .info-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .question-list-content .info-label {
          font-weight: 500;
          color: #718096;
          font-size: 14px;
        }
        .question-list-content .info-value {
          color: #2d3748;
          font-size: 14px;
        }
        .question-list-content .tags-container {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .question-list-content .detail-content-text {
          color: #4a5568;
          font-size: 14px;
          line-height: 1.8;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .question-list-content .answer-text {
          color: #38b2ac;
          background-color: #e6fffa;
          padding: 12px;
          border-radius: 6px;
        }
        .question-list-content .error-text {
          color: #e53e3e;
          background-color: #fed7d7;
          padding: 12px;
          border-radius: 6px;
        }
        .question-list-content .images-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 12px;
        }
        .question-list-content .image-item {
          cursor: pointer;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
          transition: all 0.2s;
        }
        .question-list-content .image-item:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .question-list-content .image-item img {
          width: 100%;
          height: auto;
          display: block;
        }
        @media (max-width: 768px) {
          .question-list-content {
            padding: 16px;
          }
          .question-list-content .question-filters,
          .question-list-content .search-container {
            padding: 16px;
          }
          .question-list-content .question-table th,
          .question-list-content .question-table td {
            padding: 8px;
          }
          .question-list-content .question-content {
            max-width: 200px;
          }
          .question-list-content .action-buttons {
            flex-direction: column;
            gap: 4px;
          }
          .question-list-content .detail-info-grid {
            grid-template-columns: 1fr;
          }
        }
      `;
      document.head.appendChild(style);
    }
    this.fetchSubjects();
    this.fetchQuestions();
  }
});
