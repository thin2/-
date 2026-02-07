/**
 * 顶部导航栏组件
 * 可复用的顶部导航栏组件
 */
Vue.component("app-header", {
  template: `
    <div class="app-header">
      <div class="header-left">
        <div class="toggle-btn" @click="toggleSidebar">
          <i class="fas fa-bars"></i>
        </div>
        <div>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item 
              v-for="(item, index) in breadcrumbs" 
              :key="index"
              :to="item.path ? { path: item.path } : null"
            >
              {{ item.label }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
      </div>
      <div class="header-center">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索..."
          prefix-icon="el-icon-search"
          class="header-search"
          @keyup.enter.native="handleSearch"
          @clear="handleSearchClear"
          clearable
        ></el-input>
      </div>
      <div class="header-right">
        <div class="notification" @click="handleNotification">
          <el-badge :value="notificationCount" :hidden="notificationCount === 0" class="item">
            <i class="far fa-bell"></i>
          </el-badge>
        </div>
        <div class="email-btn" @click="handleEmail">
          <el-badge :value="emailCount" :hidden="emailCount === 0" class="item">
            <i class="far fa-envelope"></i>
          </el-badge>
        </div>
        <el-dropdown trigger="click" placement="bottom-end" @command="handleUserCommand">
          <div class="user-info">
            <div class="user-avatar" :style="avatarStyle">
              <i class="fas fa-user" v-if="!userAvatar"></i>
            </div>
            <span>{{ displayUserName }}</span>
            <i class="fas fa-angle-down"></i>
          </div>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="profile">
              <i class="far fa-user"></i> 个人中心
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <i class="fas fa-sign-out-alt"></i> 退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </div>
    </div>
  `,
  props: {
    // 面包屑导航数据
    breadcrumbs: {
      type: Array,
      default: function () {
        // 根据当前页面自动生成面包屑
        const path = window.location.pathname;
        const pageMap = {
          "/dashboard": "仪表盘",
          "/question": "错题列表",
          "/subject": "科目管理",
          "/review": "复习中心",
          "/exam": "出卷自测",
          "/ai-solve": "AI解题",
          "/profile": "个人中心",
          "/setting": "系统设置",
        };
        const pageName = pageMap[path] || "仪表盘";
        return [{ label: "首页", path: "/" }, { label: pageName }];
      },
    },
    // 用户信息
    userInfo: {
      type: Object,
      default: function () {
        return {
          name: "管理员",
          email: "admin@example.com",
        };
      },
    },
    // 通知数量
    notificationCount: {
      type: Number,
      default: 3,
    },
    // 邮件数量
    emailCount: {
      type: Number,
      default: 5,
    },
  },
  data() {
    return {
      searchKeyword: "",
      currentUserInfo: null,
    };
  },
  computed: {
    // 显示的用户名
    displayUserName() {
      if (this.currentUserInfo && this.currentUserInfo.nickname) {
        return this.currentUserInfo.nickname;
      }
      if (this.userInfo && this.userInfo.name) {
        return this.userInfo.name;
      }
      return "管理员";
    },
    // 用户头像URL
    userAvatar() {
      return this.currentUserInfo && this.currentUserInfo.avatar;
    },
    // 头像样式
    avatarStyle() {
      if (this.userAvatar) {
        return {
          backgroundImage: `url(${this.userAvatar})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        };
      }
      return {};
    },
  },
  methods: {
    // 检查登录状态
    checkAuth() {
      const token = localStorage.getItem("token");
      if (!token) {
        // 如果没有token，跳转到登录页
        this.$message.warning("请先登录");
        setTimeout(() => {
          window.location.href = "/login";
        }, 1000);
        return false;
      }
      return true;
    },
    // 加载用户信息
    loadUserInfo() {
      try {
        const userInfoStr = localStorage.getItem("user_info");
        if (userInfoStr) {
          this.currentUserInfo = JSON.parse(userInfoStr);
        }
      } catch (error) {
        console.error("加载用户信息失败:", error);
      }
    },
    handleUserInfoUpdated(event) {
      const updatedInfo = (event && event.detail) ? event.detail : null;
      if (updatedInfo) {
        this.currentUserInfo = Object.assign({}, this.currentUserInfo || {}, updatedInfo);
      } else {
        this.loadUserInfo();
      }
    },
    toggleSidebar() {
      // 通过事件总线触发侧边栏切换
      this.$root.$emit("toggle-sidebar");
      this.$emit("toggle-sidebar");
    },
    handleNotification() {
      // 触发通知点击事件
      this.$emit("notification-click");
      this.$message.info("查看通知");
    },
    handleEmail() {
      // 触发邮件点击事件
      this.$emit("email-click");
      this.$message.info("查看邮件");
    },
    handleSearch() {
      // 触发搜索事件
      this.$emit("search", this.searchKeyword);
      if (this.searchKeyword.trim()) {
        this.$message.info("搜索: " + this.searchKeyword);
      }
    },
    handleSearchClear() {
      // 清空搜索时触发
      this.$emit("search", "");
    },
    handleUserCommand(command) {
      // 触发用户操作事件
      this.$emit("user-command", command);

      // 根据命令执行相应操作
      switch (command) {
        case "profile":
          window.location.href = "/profile";
          break;
        case "logout":
          this.$confirm("确定要退出登录吗？", "提示", {
            confirmButtonText: "确定",
            cancelButtonText: "取消",
            type: "warning",
          })
            .then(() => {
              // 清除本地存储的token和用户信息
              localStorage.removeItem("token");
              localStorage.removeItem("user_info");
              this.$message.success("退出登录成功");
              setTimeout(() => {
                window.location.href = "/login";
              }, 1000);
            })
            .catch(() => {
              this.$message.info("已取消退出");
            });
          break;
      }
    },
  },
  mounted() {
    // 检查登录状态
    this.checkAuth();

    // 加载用户信息
    this.loadUserInfo();
    window.addEventListener("user-info-updated", this.handleUserInfoUpdated);
    
    // 注入头部样式
    if (!document.getElementById('header-styles')) {
      const style = document.createElement('style');
      style.id = 'header-styles';
      style.textContent = `
        /* 头部导航栏样式 */
        .app-header {
          height: 60px;
          background-color: #fff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          z-index: 5;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .toggle-btn {
          font-size: 18px;
          cursor: pointer;
          color: #666;
          transition: color 0.3s;
        }

        .toggle-btn:hover {
          color: #4299e1;
        }

        .header-center {
          flex: 1;
          display: flex;
          justify-content: center;
          padding: 0 20px;
        }

        .header-search {
          max-width: 400px;
          width: 100%;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .notification,
        .messages,
        .help {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: #f8f9fa;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }

        .notification:hover,
        .messages:hover,
        .help:hover {
          background-color: #e8f4f8;
          color: #4299e1;
        }

        .notification-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          background-color: #f56c6c;
          color: #fff;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          font-size: 10px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          padding: 6px 12px;
          border-radius: 6px;
          transition: background-color 0.2s;
        }

        .user-info:hover {
          background-color: #f8f9fa;
        }

        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: #e8f4f8;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #4299e1;
          font-size: 16px;
        }

        .user-info span {
          color: #333;
          font-size: 14px;
        }

        .user-info .fa-angle-down {
          color: #666;
          font-size: 12px;
        }

        @media (max-width: 768px) {
          .header-center {
            display: none;
          }
        }
      `;
      document.head.appendChild(style);
    }
  },
  beforeDestroy() {
    window.removeEventListener("user-info-updated", this.handleUserInfoUpdated);
  }
});
