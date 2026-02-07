/**
 * 仪表盘页面组件
 * 包含统计卡片和最近错题表格
 */
Vue.component('app-dashboard', {
  template: `
    <div class="dashboard-content">
      <h2 class="page-title">{{ title }}</h2>

      <!-- 统计卡片 -->
      <div class="stat-cards">
        <div 
          v-for="(card, index) in statCards" 
          :key="index"
          class="stat-card"
        >
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
          <div class="chart-title">复习趋势分析</div>
          <div class="chart-placeholder">
            <div ref="lineChart" class="chart-canvas"></div>
          </div>
        </div>
        <div class="chart-item">
          <div class="chart-title">掌握状态分布</div>
          <div class="chart-placeholder">
            <div ref="masteryChart" class="chart-canvas"></div>
          </div>
        </div>
      </div>
    </div>
  `,
  props: {
    // 页面标题
    title: {
      type: String,
      default: '仪表盘'
    },
    // 表格标题
    tableTitle: {
      type: String,
      default: '最近错题'
    }
  },
  data() {
    return {
      loading: false,
      // 统计卡片数据
      statCards: [
        { icon: 'fa fa-question-circle', value: '0', label: '总错题数', color: 'blue', desc: '' },
        { icon: 'fa fa-check', value: '0%', label: '复习完成率', color: 'orange', desc: '' },
        { icon: 'far fa-clock', value: '0', label: '今日复习', color: 'blue', desc: '' },
        { icon: 'fas fa-list', value: '0', label: '待复习', color: 'orange', desc: '' },
        { icon: 'fas fa-check-circle', value: '0', label: '已复习', color: 'green', desc: '' },
        { icon: 'fas fa-calendar', value: '0', label: '连续复习天数', color: 'purple', desc: '' }
      ],
      // 复习统计数据
      reviewStats: {
        today_count: 0,
        pending_count: 0,
        reviewed_count: 0,
        streak_days: 0
      },
      // 错题分类分布数据
      pieData: [],
      // 复习趋势数据
      lineData: {
        dates: [],
        counts: []
      },
      // 掌握状态分布数据
      masteryData: [],
      // 图表实例
      pieChartInstance: null,
      lineChartInstance: null,
      masteryChartInstance: null
    };
  },
  computed: {},
  methods: {
    async fetchDashboardData() {
      this.loading = true;
      try {
        // 获取统计数据
        const statsRes = await dashboardAPI.stats();
        // 获取复习统计数据
        const reviewStatsRes = await reviewAPI.stats();
        
        if (statsRes && statsRes.data) {
          const stats = statsRes.data;
          if (reviewStatsRes && reviewStatsRes.data) {
            this.reviewStats = reviewStatsRes.data;
          }
          
          this.statCards = [
            {
              icon: 'fa fa-question-circle',
              value: stats.total_count || 0,
              label: '总错题数',
              color: 'blue',
              desc: ''
            },
            {
              icon: 'fa fa-check',
              value: `${stats.review_rate || 0}%`,
              label: '复习完成率',
              color: 'orange',
              desc: stats.week_reviewed_count ? `本周新增 ${stats.week_reviewed_count} 题` : ''
            },
            {
              icon: 'far fa-clock',
              value: this.reviewStats.today_count || 0,
              label: '今日复习',
              color: 'blue',
              desc: ''
            },
            {
              icon: 'fas fa-list',
              value: this.reviewStats.pending_count || 0,
              label: '待复习',
              color: 'orange',
              desc: ''
            },
            {
              icon: 'fas fa-check-circle',
              value: this.reviewStats.reviewed_count || 0,
              label: '已复习',
              color: 'green',
              desc: ''
            },
            {
              icon: 'fas fa-calendar',
              value: this.reviewStats.streak_days || 0,
              label: '连续复习天数',
              color: 'purple',
              desc: ''
            }
          ];
        }

        // 获取科目分布数据
        const subjectRes = await dashboardAPI.subjectDistribution();
        if (subjectRes && subjectRes.data) {
          this.pieData = subjectRes.data || [];
          this.updatePieChart();
        }

        // 获取复习趋势数据
        const trendRes = await dashboardAPI.reviewTrend();
        if (trendRes && trendRes.data) {
          this.lineData = trendRes.data || { dates: [], counts: [] };
          this.updateLineChart();
        }

        // 获取掌握状态分布数据
        const masteryRes = await dashboardAPI.masteryStatus();
        if (masteryRes && masteryRes.data) {
          this.masteryData = masteryRes.data || [];
          this.updateMasteryChart();
        }
      } catch (error) {
        console.error('获取仪表盘数据失败:', error);
        this.$message.error('获取数据失败');
      } finally {
        this.loading = false;
      }
    },
    initCharts() {
      if (typeof echarts === 'undefined') {
        // ECharts 未加载则直接返回
        return;
      }
      this.initPieChart();
      this.initLineChart();
      this.initMasteryChart();
    },
    initPieChart() {
      const dom = this.$refs.pieChart;
      if (!dom) return;
      this.pieChartInstance = echarts.init(dom);
      this.updatePieChart();
    },
    updatePieChart() {
      if (!this.pieChartInstance) return;
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          bottom: 0,
          left: 'center'
        },
        series: [
          {
            name: '错题数',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 8,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 18,
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: this.pieData.map(item => ({
              name: item.name,
              value: item.value,
              itemStyle: {
                color: item.color || '#4299e1'
              }
            }))
          }
        ]
      };
      this.pieChartInstance.setOption(option);
    },
    initLineChart() {
      const dom = this.$refs.lineChart;
      if (!dom) return;
      this.lineChartInstance = echarts.init(dom);
      this.updateLineChart();
    },
    updateLineChart() {
      if (!this.lineChartInstance) return;
      const option = {
        tooltip: {
          trigger: 'axis',
          formatter: '{b}<br/>{a}: {c} 题'
        },
        xAxis: {
          type: 'category',
          data: this.lineData.dates || [],
          boundaryGap: false
        },
        yAxis: {
          type: 'value',
          name: '复习题数',
          minInterval: 1
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        series: [
          {
            name: '复习题数',
            type: 'line',
            smooth: true,
            data: this.lineData.counts || [],
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(66, 153, 225, 0.3)' },
                  { offset: 1, color: 'rgba(66, 153, 225, 0.1)' }
                ]
              }
            },
            lineStyle: {
              color: '#4299e1',
              width: 3
            },
            itemStyle: {
              color: '#4299e1',
              borderWidth: 2,
              borderColor: '#fff'
            },
            symbol: 'circle',
            symbolSize: 8
          }
        ]
      };
      this.lineChartInstance.setOption(option);
    },
    initMasteryChart() {
      const dom = this.$refs.masteryChart;
      if (!dom) return;
      this.masteryChartInstance = echarts.init(dom);
      this.updateMasteryChart();
    },
    updateMasteryChart() {
      if (!this.masteryChartInstance) return;
      const colorMap = {
        'mastered': '#48bb78',
        'hard': '#ed8936',
        'forgot': '#e53e3e',
        'none': '#a0aec0'
      };
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          bottom: 0,
          left: 'center'
        },
        series: [
          {
            name: '掌握状态',
            type: 'pie',
            radius: '65%',
            center: ['50%', '45%'],
            itemStyle: {
              borderRadius: 8,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: true,
              formatter: '{b}\n{d}%'
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            },
            data: this.masteryData.map(item => ({
              name: item.name,
              value: item.value,
              itemStyle: {
                color: colorMap[item.status] || '#a0aec0'
              }
            }))
          }
        ]
      };
      this.masteryChartInstance.setOption(option);
    }
  },
  mounted() {
    // 注入页面样式
    if (!document.getElementById('dashboard-styles')) {
      const style = document.createElement('style');
      style.id = 'dashboard-styles';
      style.textContent = `
        .dashboard-content {
          flex: 1;
          padding: 24px;
          overflow-y: auto;
          background-color: #f5f7fa;
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
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
          margin-bottom: 32px;
        }
        .stat-card {
          background: #fff;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
          display: flex;
          align-items: center;
          gap: 20px;
          transition: all 0.3s ease;
          border: 1px solid #e2e8f0;
        }
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
          border-color: #cbd5e0;
        }
        .card-icon {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          flex-shrink: 0;
        }
        .icon-blue {
          background: linear-gradient(135deg, #e8f4f8 0%, #e6fffa 100%);
          color: #4299e1;
        }
        .icon-purple {
          background: linear-gradient(135deg, #faf0f5 0%, #f7fafc 100%);
          color: #9f7aea;
        }
        .icon-green {
          background: linear-gradient(135deg, #eaf6fa 0%, #f0fff4 100%);
          color: #38b2ac;
        }
        .icon-orange {
          background: linear-gradient(135deg, #fef7fb 0%, #fffaf0 100%);
          color: #ed8936;
        }
        .card-value {
          font-size: 28px;
          font-weight: 700;
          color: #2d3748;
          margin-bottom: 6px;
          line-height: 1;
        }
        .card-label {
          font-size: 14px;
          color: #718096;
          font-weight: 500;
          margin-bottom: 4px;
        }
        .card-desc {
          font-size: 12px;
          color: #a0aec0;
          margin-top: 2px;
        }
        .charts-container {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin: 24px 0;
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
        .chart-canvas {
          width: 100%;
          height: 100%;
        }
        @media (max-width: 1200px) {
          .charts-container {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 768px) {
          .dashboard-content {
            padding: 16px;
          }
          .page-title {
            font-size: 20px;
            margin-bottom: 16px;
          }
          .stat-cards {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .stat-card {
            padding: 20px;
          }
          .charts-container {
            grid-template-columns: 1fr;
          }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .stat-cards {
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          }
        }
      `;
      document.head.appendChild(style);
    }
    // 先获取数据，再初始化图表
    this.fetchDashboardData().then(() => {
      this.$nextTick(() => {
        this.initCharts();
        // 简单处理窗口缩放时的自适应
        window.addEventListener('resize', () => {
          if (this.pieChartInstance) {
            this.pieChartInstance.resize();
          }
          if (this.lineChartInstance) {
            this.lineChartInstance.resize();
          }
          if (this.masteryChartInstance) {
            this.masteryChartInstance.resize();
          }
        });
      });
    });
  }
});

