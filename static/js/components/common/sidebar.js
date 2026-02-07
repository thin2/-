/**
 * 侧边栏组件
 * 可复用的侧边栏导航组件
 */
Vue.component('app-sidebar', {
  template: `
    <div class="sidebar" :class="{ 'collapsed': isCollapsed }">
      <div class="sidebar-logo">
        <i class="fas fa-book"></i>
        <span v-show="!isCollapsed">错题管理系统</span>
      </div>
      <el-menu 
        :default-active="activeMenu" 
        class="el-menu-vertical-demo" 
        background-color="#2d3748" 
        text-color="#fff"
        :collapse="isCollapsed"
        :collapse-transition="false"
        @select="handleMenuSelect"
      >
        <template v-for="item in menuItems">
          <el-menu-item 
            :key="item.index"
            :index="item.index"
            v-if="!item.children"
          >
            <i :class="item.icon"></i>
            <span slot="title">{{ item.title }}</span>
          </el-menu-item>
          
          <el-submenu 
            :key="item.index"
            :index="item.index"
            v-if="item.children"
          >
            <template slot="title">
              <i :class="item.icon"></i>
              <span slot="title">{{ item.title }}</span>
            </template>
            <el-menu-item 
              v-for="child in item.children" 
              :key="child.index"
              :index="child.index"
            >
              {{ child.title }}
            </el-menu-item>
          </el-submenu>
        </template>
      </el-menu>
    </div>
  `,
  props: {
    // 当前激活的菜单项
    activeMenu: {
      type: String,
      default: function() {
        // 根据当前页面自动确定激活菜单
        const path = window.location.pathname;
        if (path.includes('/dashboard')) return 'dashboard';
        if (path.includes('/question')) return 'question-list';
        if (path.includes('/subject')) return 'subject';
        if (path.includes('/review')) return 'review';
        if (path.includes('/exam')) return 'exam';
        if (path.includes('/ai-solve')) return 'ai-solve';
        if (path.includes('/profile')) return 'profile';
        return 'dashboard';
      }
    },
    // 菜单配置数据
    menuItems: {
      type: Array,
      default: function() {
        return [
          {
            index: 'dashboard',
            title: '仪表盘',
            icon: 'fas fa-tachometer-alt'
          },
          {
            index: 'question-list',
            title: '错题管理',
            icon: 'fas fa-question-circle'
          },
          {
            index: 'review',
            title: '复习中心',
            icon: 'fas fa-sync-alt'
          },
          {
            index: 'exam',
            title: '出卷自测',
            icon: 'fas fa-file-alt'
          },
          {
            index: 'ai-solve',
            title: 'AI解题',
            icon: 'far fa-edit'
          },
          {
            index: 'profile',
            title: '个人中心',
            icon: 'fas fa-user-circle'
          }
        ];
      }
    },
    // 是否折叠
    collapsed: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      isCollapsed: this.collapsed
    };
  },
  watch: {
    collapsed(newVal) {
      this.isCollapsed = newVal;
    }
  },
  methods: {
    handleMenuSelect(index) {
      // 触发菜单选择事件
      this.$emit('menu-select', index);
      
      // 根据菜单项跳转页面
      const routeMap = {
        'dashboard': '/dashboard',
        'question-list': '/question',
        'subject': '/subject',
        'review': '/review',
        'exam': '/exam',
        'ai-solve': '/ai-solve',
        'profile': '/profile'
      };
      
      if (routeMap[index]) {
        window.location.href = routeMap[index];
      }
    },
    toggle() {
      this.isCollapsed = !this.isCollapsed;
      this.$emit('toggle', this.isCollapsed);
    }
  },
  mounted() {
    // 监听侧边栏切换事件
    this.$root.$on('toggle-sidebar', () => {
      this.toggle();
    });
    
    // 注入侧边栏样式
    if (!document.getElementById('sidebar-styles')) {
      const style = document.createElement('style');
      style.id = 'sidebar-styles';
      style.textContent = `
        /* 侧边栏样式 */
        .sidebar {
          width: 220px;
          background-color: #2d3748;
          color: #fff;
          transition: all 0.3s;
          min-height: 100vh;
          overflow: hidden;
          position: relative;
          display: flex;
          flex-direction: column;
        }

        .sidebar.collapsed {
          width: 64px;
        }

        .sidebar-logo {
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          font-size: 18px;
          font-weight: 600;
          color: #fff;
          gap: 10px;
          flex-shrink: 0;
        }

        .sidebar-logo i {
          font-size: 20px;
          color: #4299e1;
          min-width: 20px;
        }

        .sidebar-logo span {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sidebar.collapsed .sidebar-logo {
          padding: 0;
          justify-content: center;
        }

        .sidebar.collapsed .sidebar-logo span {
          display: none;
        }

        .el-menu-vertical-demo {
          border: none;
          background: transparent;
          flex: 1;
          overflow-y: auto;
        }

        .el-menu-vertical-demo .el-menu-item,
        .el-menu-vertical-demo .el-submenu__title {
          color: #a0aec0 !important;
          border-radius: 0;
          margin: 0;
          height: 48px;
          line-height: 48px;
          padding: 0 20px !important;
          transition: all 0.3s;
        }

        .el-menu-vertical-demo .el-menu-item:hover,
        .el-menu-vertical-demo .el-submenu__title:hover {
          background-color: rgba(66, 153, 225, 0.1) !important;
          color: #fff !important;
        }

        .el-menu-vertical-demo .el-menu-item.is-active {
          background-color: #4299e1 !important;
          color: #fff !important;
          position: relative;
        }

        .el-menu-vertical-demo .el-menu-item.is-active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background-color: #63b3ed;
        }

        .el-menu-vertical-demo .el-submenu .el-menu-item {
          background-color: rgba(0, 0, 0, 0.1);
          padding-left: 45px !important;
        }

        .el-menu-vertical-demo .el-submenu .el-menu-item:hover {
          background-color: rgba(66, 153, 225, 0.15) !important;
        }

        .sidebar.collapsed .el-menu-vertical-demo .el-menu-item,
        .sidebar.collapsed .el-menu-vertical-demo .el-submenu__title {
          padding: 0 20px !important;
          justify-content: center;
        }

        .sidebar.collapsed .el-menu-vertical-demo .el-menu-item span,
        .sidebar.collapsed .el-menu-vertical-demo .el-submenu__title span {
          display: none;
        }

        .sidebar.collapsed .el-menu-vertical-demo .el-submenu .el-menu-item {
          padding-left: 20px !important;
        }
      `;
      document.head.appendChild(style);
    }
  }
});


