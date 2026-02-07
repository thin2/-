/**
 * 个人中心页面组件
 */
Vue.component('app-profile', {
  template: `
    <div class="profile-content">
      <h2 class="page-title">个人中心</h2>

      <div class="profile-container">
        <div class="profile-card">
          <el-tabs v-model="activeTab">
            <!-- 个人头像 Tab -->
            <el-tab-pane label="个人头像" name="avatar">
              <div class="tab-content">
                <div class="avatar-tab-content">
                  <el-avatar :size="80" :src="userInfo.avatar">
                    <i class="fas fa-user"></i>
                  </el-avatar>
                  <div class="avatar-actions">
                    <input 
                      type="file" 
                      ref="avatarInput" 
                      style="display: none" 
                      accept="image/*"
                      @change="handleAvatarChange"
                    >
                    <el-button 
                      type="primary" 
                      size="medium" 
                      :loading="uploading"
                      @click="triggerAvatarUpload"
                    >
                      <i class="fas fa-camera"></i> 更换头像
                    </el-button>
                                      </div>
                  <p class="avatar-tip">支持 JPG、PNG、GIF 格式，文件大小不超过 2MB</p>
                </div>
              </div>
            </el-tab-pane>

            <!-- 个人资料 Tab -->
            <el-tab-pane label="个人资料" name="profile">
              <div class="tab-content">
                <el-form :model="userInfo" :rules="rules" ref="profileForm" label-width="100px" class="profile-form">
                      <el-form-item label="昵称" prop="nickname">
                        <el-input v-model="userInfo.nickname" placeholder="请输入昵称"></el-input>
                      </el-form-item>
                      <el-form-item label="邮箱" prop="email">
                        <el-input v-model="userInfo.email" placeholder="请输入邮箱"></el-input>
                      </el-form-item>
                      <el-form-item label="手机号" prop="phone">
                        <el-input v-model="userInfo.phone" placeholder="请输入手机号" maxlength="11"></el-input>
                      </el-form-item>
                      <el-form-item label="性别" prop="gender">
                        <el-radio-group v-model="userInfo.gender">
                          <el-radio label="男">男</el-radio>
                          <el-radio label="女">女</el-radio>
                          <el-radio label="保密">保密</el-radio>
                        </el-radio-group>
                      </el-form-item>
                      <el-form-item label="个人简介" prop="bio">
                        <el-input 
                          type="textarea" 
                          :rows="4" 
                          v-model="userInfo.bio" 
                          placeholder="请输入个人简介"
                          maxlength="200"
                          show-word-limit
                        ></el-input>
                      </el-form-item>
                      <el-form-item>
                        <el-button type="primary" @click="saveProfile" :loading="saving">保存修改</el-button>
                      </el-form-item>
                    </el-form>
              </div>
            </el-tab-pane>

            <!-- 修改密码 Tab -->
            <el-tab-pane label="修改密码" name="password">
              <div class="tab-content">
                <el-form :model="passwordForm" :rules="passwordRules" ref="passwordForm" label-width="100px" class="profile-form">
                  <el-form-item label="当前密码" prop="oldPassword">
                    <el-input 
                      v-model="passwordForm.oldPassword" 
                      type="password" 
                      placeholder="请输入当前密码"
                      show-password
                    ></el-input>
                  </el-form-item>
                  <el-form-item label="新密码" prop="newPassword">
                    <el-input 
                      v-model="passwordForm.newPassword" 
                      type="password" 
                      placeholder="请输入新密码（6-10位）"
                      show-password
                    ></el-input>
                  </el-form-item>
                  <el-form-item label="确认密码" prop="confirmPassword">
                    <el-input 
                      v-model="passwordForm.confirmPassword" 
                      type="password" 
                      placeholder="请再次输入新密码"
                      show-password
                    ></el-input>
                  </el-form-item>
                  <el-form-item>
                    <el-button type="primary" @click="changePassword" :loading="changingPassword">修改密码</el-button>
                    <el-button @click="resetPasswordForm">重置</el-button>
                  </el-form-item>
                </el-form>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </div>
  `,
  data() {
    const validateConfirmPassword = (rule, value, callback) => {
      if (value !== this.passwordForm.newPassword) {
        callback(new Error('两次输入的密码不一致'));
      } else {
        callback();
      }
    };

    return {
      activeTab: 'avatar',
      originalUserInfo: {},
      userInfo: {
        nickname: '',
        email: '',
        avatar: '',
        phone: '',
        gender: '保密',
        bio: ''
      },
      passwordForm: {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      saving: false,
      changingPassword: false,
      uploading: false,
      rules: {
        nickname: [
          { required: true, message: '请输入昵称', trigger: 'blur' }
        ],
        email: [
          { required: true, message: '请输入邮箱', trigger: 'blur' },
          { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
        ],
        phone: [
          { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
        ],
        gender: [
          { required: true, message: '请选择性别', trigger: 'change' }
        ]
      },
      passwordRules: {
        oldPassword: [
          { required: true, message: '请输入当前密码', trigger: 'blur' }
        ],
        newPassword: [
          { required: true, message: '请输入新密码', trigger: 'blur' },
          { min: 6, max: 10, message: '密码长度在 6 到 10 个字符', trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, message: '请再次输入新密码', trigger: 'blur' },
          { validator: validateConfirmPassword, trigger: 'blur' }
        ]
      }
    };
  },
  methods: {
    async initializePage() {
      await this.loadUserProfile();
      window.addEventListener('user-info-updated', this.handleExternalUserInfoUpdate);
      this.injectPageStyles();
    },
    handleExternalUserInfoUpdate(event) {
      const payload = (event && event.detail) ? event.detail : null;
      if (payload && Object.keys(payload).length) {
        this.userInfo = Object.assign({}, this.userInfo, payload);
        this.originalUserInfo = Object.assign({}, this.originalUserInfo, payload);
      }
    },
    updateCachedUserInfo(partial = {}) {
      try {
        const cached = JSON.parse(localStorage.getItem('user_info') || '{}');
        const next = Object.assign({}, cached, partial);
        localStorage.setItem('user_info', JSON.stringify(next));
        window.dispatchEvent(new CustomEvent('user-info-updated', { detail: next }));
      } catch (error) {
        console.warn('同步用户信息缓存失败:', error);
      }
    },
    injectPageStyles() {
      if (document.getElementById('profile-styles')) {
        return;
      }
      const style = document.createElement('style');
      style.id = 'profile-styles';
      style.textContent = `
        .profile-content {
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
        .profile-container {
          width: 100%;
        }
        .profile-card {
          background: #fff;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
          border: 1px solid #e2e8f0;
          width: 100%;
        }
        .tab-content {
          padding: 20px 0;
        }
        .avatar-tab-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 0;
          min-height: 300px;
        }
        .avatar-actions {
          margin-top: 24px;
          display: flex;
          gap: 12px;
        }
        .avatar-tip {
          margin-top: 16px;
          color: #a0aec0;
          font-size: 14px;
        }
        .profile-form {
          max-width: 600px;
        }
        .avatar-uploader .el-upload {
          border: none;
          background: none;
        }
      `;
      document.head.appendChild(style);
    },
    async loadUserProfile() {
      try {
        const res = await profileAPI.getProfile();
        if (res && res.data) {
          this.userInfo = res.data;
          this.originalUserInfo = Object.assign({}, res.data);
          this.updateCachedUserInfo(res.data);
        }
      } catch (error) {
        console.error('获取用户资料失败:', error);
      }
    },

    triggerAvatarUpload() {
      this.$refs.avatarInput.click();
    },

    async handleAvatarChange(event) {
      const file = event.target.files[0];
      if (!file) return;

      // 验证文件类型
      const isImage = /^image\/(jpeg|png|jpg|gif)$/.test(file.type);
      const isLt2M = file.size / 1024 / 1024 < 2;

      if (!isImage) {
        this.$message.error('头像只能是 JPG、PNG、GIF 格式!');
        event.target.value = '';
        return;
      }
      if (!isLt2M) {
        this.$message.error('头像大小不能超过 2MB!');
        event.target.value = '';
        return;
      }

      try {
        this.uploading = true;
        
        const res = await uploadAPI.uploadAvatar(file);
        if (res && res.code === 0) {
          const avatarUrl = res.data.url;
          this.userInfo.avatar = avatarUrl;
          this.originalUserInfo.avatar = avatarUrl;
          this.updateCachedUserInfo({ avatar: avatarUrl });
          this.$message.success('头像上传成功');
        } else {
          this.$message.error(res.message || '头像上传失败');
        }
      } catch (error) {
        console.error('上传头像失败:', error);
        this.$message.error(error.message || '头像上传失败');
      } finally {
        this.uploading = false;
        // 清空文件输入
        event.target.value = '';
      }
    },

    
    async saveProfile() {
      try {
        await this.$refs.profileForm.validate();
        this.saving = true;
        
        const res = await profileAPI.updateProfile(this.userInfo);
        if (res && res.code === 0) {
          this.$message.success('保存成功');
          this.originalUserInfo = Object.assign({}, this.userInfo);
          this.updateCachedUserInfo(this.userInfo);
        }
      } catch (error) {
        console.error('保存资料失败:', error);
      } finally {
        this.saving = false;
      }
    },

    async changePassword() {
      try {
        await this.$refs.passwordForm.validate();
        this.changingPassword = true;
        
        const res = await profileAPI.changePassword(this.passwordForm);
        if (res && res.code === 0) {
          this.$message.success('密码修改成功，请重新登录');
          this.resetPasswordForm();
          setTimeout(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user_info');
            window.location.href = '/login';
          }, 1000);
        } else if (res && res.message) {
          this.$message.error(res.message);
        }
      } catch (error) {
        console.error('修改密码失败:', error);
        this.$message.error(error.message || '修改密码失败');
      } finally {
        this.changingPassword = false;
      }
    },

    
    resetPasswordForm() {
      this.passwordForm = {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      };
      this.$refs.passwordForm.clearValidate();
    }
  },
  mounted() {
    this.initializePage();
  },
  beforeDestroy() {
    window.removeEventListener('user-info-updated', this.handleExternalUserInfoUpdate);
  }
});

