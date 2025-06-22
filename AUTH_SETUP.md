# 🔐 wxchat 访问鉴权功能配置指南

## 📋 功能概述

为wxchat项目添加了完整的访问鉴权功能，提升隐私保护和安全性。

### ✨ 主要特性

- 🔒 **密码验证** - 用户需要输入正确密码才能访问应用
- 🎨 **WeChat风格UI** - 简洁美观的登录界面，符合WeChat绿色主题
- 🛡️ **安全防护** - 防暴力破解、会话管理、token验证
- ⚡ **无缝集成** - 基于现有架构，不影响原有功能
- 📱 **响应式设计** - 完美适配移动端和桌面端

## 🚀 快速配置

### 1. 环境变量配置

在Cloudflare Workers控制台中设置以下环境变量：

#### 🎯 **简化配置方式**

直接在 **Workers & Pages** → **你的应用** → **设置** → **变量和机密** 中添加：

```bash
# 访问密码（明文，直接配置即可）
ACCESS_PASSWORD = "wxchat2024"

# JWT密钥（请更换为您自己的密钥）
JWT_SECRET = "your-super-secret-jwt-key-change-this-in-production"

# 会话过期时间（小时）
SESSION_EXPIRE_HOURS = "24"

# 最大登录尝试次数
MAX_LOGIN_ATTEMPTS = "5"
```

### 2. 修改默认密码

**超级简单！** 直接在Cloudflare Workers控制台修改 `ACCESS_PASSWORD` 环境变量即可：

1. 进入 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 选择 **Workers & Pages**
3. 点击你的 `wxchat` 应用
4. 进入 **设置** → **变量和机密**
5. 找到 `ACCESS_PASSWORD` 变量
6. 点击 **编辑** 按钮
7. 输入新密码（如：`my-new-password-123`）
8. 点击 **保存**

**就这么简单！** 🎉 无需生成哈希值，无需复杂操作！

### 3. 部署应用

```bash
# 部署到Cloudflare Workers
npm run deploy
```

### 4. 配置步骤图解

#### 📱 **在Cloudflare控制台配置环境变量**

1. **进入Workers控制台**
   ```
   https://dash.cloudflare.com/ → Workers & Pages → wxchat
   ```

2. **添加环境变量**
   ```
   设置 → 变量和机密 → 添加变量
   ```

3. **配置必需变量**
   ```
   变量名: ACCESS_PASSWORD
   值: wxchat2024 (或您的自定义密码)

   变量名: JWT_SECRET
   值: your-jwt-secret-key-at-least-32-chars

   变量名: SESSION_EXPIRE_HOURS
   值: 24

   变量名: MAX_LOGIN_ATTEMPTS
   值: 5
   ```

4. **保存并重新部署**
   ```bash
   npm run deploy
   ```

## 🔧 技术实现

### 前端组件

- **`public/login.html`** - 独立的登录页面
- **`public/css/auth.css`** - 登录界面样式
- **`public/js/auth.js`** - 鉴权逻辑模块

### 后端实现

- **JWT Token认证** - 安全的会话管理
- **密码哈希验证** - SHA-256加密存储
- **中间件保护** - 自动拦截未认证请求
- **防暴力破解** - 限制登录尝试次数

### 安全特性

1. **密码保护**
   - 简化配置，直接明文存储在环境变量中
   - 支持任意自定义密码

2. **会话管理**
   - JWT token自动过期
   - 可配置会话时长
   - 自动刷新机制

3. **防护机制**
   - 限制登录尝试次数（默认5次）
   - 15分钟冷却时间
   - IP级别的保护

4. **用户体验**
   - 记住登录状态
   - 优雅的错误提示
   - 响应式设计

## 🎯 使用说明

### 首次访问

1. 访问应用URL，自动跳转到登录页面
2. 输入访问密码（默认：`wxchat2024`）
3. 点击登录按钮
4. 登录成功后自动跳转到聊天界面

### 登出操作

- 点击右上角的"🔒 登出"按钮
- 确认后清除登录状态，跳转到登录页面

### 密码忘记

如果忘记密码，请联系管理员重新设置环境变量中的密码哈希值。

## 🛠️ 自定义配置

### 修改访问密码

**超级简单！** 在Cloudflare控制台直接修改：

```
Workers & Pages → wxchat → 设置 → 变量和机密
找到 ACCESS_PASSWORD → 编辑 → 输入新密码 → 保存
```

### 修改会话时长

```
SESSION_EXPIRE_HOURS = "48"  # 48小时过期
```

### 调整安全策略

```
MAX_LOGIN_ATTEMPTS = "3"  # 最多3次尝试
```

### 自定义JWT密钥

**重要：生产环境必须更换JWT密钥！**

```
JWT_SECRET = "your-production-secret-key-at-least-32-characters-long"
```

## 🔍 故障排除

### 常见问题

1. **无法登录**
   - 检查密码是否正确
   - 确认环境变量配置正确
   - 查看浏览器控制台错误信息

2. **频繁要求登录**
   - 检查JWT_SECRET是否配置
   - 确认会话时长设置
   - 清除浏览器缓存重试

3. **登录尝试次数过多**
   - 等待15分钟后重试
   - 或清除浏览器localStorage

### 调试模式

在浏览器控制台中查看详细日志：

```javascript
// 查看当前认证状态
console.log('认证状态:', Auth.isAuthenticated());

// 查看token信息
console.log('Token:', Auth.getToken());

// 手动验证token
Auth.checkAuthentication().then(result => {
    console.log('验证结果:', result);
});
```

## 🔄 升级说明

从无鉴权版本升级到鉴权版本：

1. 备份现有数据
2. 更新代码文件
3. 配置环境变量
4. 重新部署应用
5. 测试登录功能

## 📞 技术支持

如遇到问题，请检查：

1. Cloudflare Workers日志
2. 浏览器开发者工具
3. 网络连接状态
4. 环境变量配置

---

**🔒 安全提醒：**
- 定期更换访问密码
- 使用强密码策略
- 监控异常登录行为
- 及时更新JWT密钥
