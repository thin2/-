/**
 * 数据统计页面组件
 */
Vue.component('app-statistics', {
  template: `
    <div class="statistics-content">
      <h2 class="page-title">数据统计</h2>

      <!-- 统计卡片 -->
      <div class="stat-cards">
        <div class="stat-card" v-for="(card, index) in statCards" :key="index">
          <div class="card-icon" :class="'icon-' + card.color">
            <i :class="card.icon"></i>
          </div>
          <div>
            <div class="card-value">{{ card.value }}</div>
            <div class="card-label">{{ card.label }}</div>
            <div v-if="card.desc" class="card-desc">{{ card.desc }}</div>
          </div>
        </div>
      </div>

      <!-- 图表区域 -->
      <div class="charts-container">
        <div class="chart-item">
          <div class="chart-title">错题分类分布</div>
          <div class="chart-placeholder">
            <i class="fas fa-chart-pie" style="font-size: 48px; color: #4299e1;"></i>
            <p>饼图：错题分类分布</p>
          </div>
        </div>
        <div class="chart-item">
          <div class="chart-title">错题趋势分析</div>
          <div class="chart-placeholder">
            <i class="fas fa-chart-line" style="font-size: 48px; color: #9f7aea;"></i>
            <p>折线图：错题趋势分析</p>
          </div>
        </div>
      </div>

      <!-- 详细统计表格 -->
      <div class="table-container">
        <div class="table-title">分类详细统计</div>
        <el-table :data="categoryStats" border style="width: 100%;">
          <el-table-column prop="category" label="分类" width="150"></el-table-column>
          <el-table-column prop="total" label="总题数" width="120" align="center"></el-table-column>
          <el-table-column prop="reviewed" label="已复习" width="120" align="center"></el-table-column>
          <el-table-column prop="unreviewed" label="未复习" width="120" align="center"></el-table-column>
          <el-table-column prop="reviewRate" label="复习率" width="120" align="center">
            <template slot-scope="scope">
              <el-progress :percentage="scope.row.reviewRate" :color="getProgressColor(scope.row.reviewRate)"></el-progress>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  `,
  data() {
    return {
      statCards: [
        { icon: 'fa fa-question-circle', value: '1,286', label: '总错题数', color: 'blue', desc: '较上月 +12%' },
        { icon: 'fa fa-check-circle', value: '328', label: '已复习', color: 'green', desc: '复习率 25.5%' },
        { icon: 'fa fa-clock-o', value: '958', label: '待复习', color: 'orange', desc: '需要重点关注' },
        { icon: 'fa fa-trophy', value: '18', label: '分类数量', color: 'purple', desc: '涵盖多个领域' }
      ],
      categoryStats: [
        { category: '前端开发', total: 456, reviewed: 120, unreviewed: 336, reviewRate: 26 },
        { category: '后端开发', total: 342, reviewed: 98, unreviewed: 244, reviewRate: 29 },
        { category: '数据库', total: 198, reviewed: 65, unreviewed: 133, reviewRate: 33 },
        { category: '计算机网络', total: 156, reviewed: 28, unreviewed: 128, reviewRate: 18 },
        { category: '中间件', total: 134, reviewed: 17, unreviewed: 117, reviewRate: 13 }
      ]
    };
  },
  methods: {
    getProgressColor(rate) {
      if (rate >= 30) return '#67c23a';
      if (rate >= 20) return '#e6a23c';
      return '#f56c6c';
    }
  },
  mounted() {
    if (!document.getElementById('statistics-styles')) {
      const style = document.createElement('style');
      style.id = 'statistics-styles';
      style.textContent = `
        .statistics-content {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
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
        
        .card-desc {
          font-size: 12px;
          color: #a0aec0;
          margin-top: 4px;
        }
        
        .charts-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .chart-item {
          background: #fff;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        
        .chart-title {
          font-size: 16px;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 20px;
        }
        
        .chart-placeholder {
          height: 300px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #a0aec0;
        }
        
        .table-container {
          background: #fff;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        
        .table-title {
          font-size: 16px;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 15px;
        }
      `;
      document.head.appendChild(style);
    }
  }
});

