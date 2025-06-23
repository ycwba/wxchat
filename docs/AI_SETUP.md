# AI功能配置指南

## 🤖 硅基流动AI集成

本项目已集成硅基流动的DeepSeek-R1模型，支持AI对话、思考功能和流式输出。

### 📋 环境变量配置

在Cloudflare Workers控制台中，需要配置以下环境变量：

#### 必需的环境变量

```
变量名: SILICONFLOW_API_KEY
类型: 纯文本
值: 你的硅基流动API密钥
```

#### 现有环境变量（保持不变）

```
ACCESS_PASSWORD = wxchat2024
JWT_SECRET = your-super-secret-jwt-key-change-this-in-production
MAX_LOGIN_ATTEMPTS = 5
SESSION_EXPIRE_HOURS = 24
```

### 🔑 获取API密钥

1. 访问 [硅基流动官网](https://siliconflow.cn/)
2. 注册账号并登录
3. 进入控制台，创建API密钥
4. 复制密钥并添加到Cloudflare环境变量中

### 🎯 AI模型信息

- **模型名称**: `deepseek-ai/DeepSeek-R1-0528-Qwen3-8B`
- **支持功能**: 
  - 💬 对话聊天
  - 🧠 思考过程展示
  - 🌊 流式输出
  - 📝 长文本处理

### 🚀 功能特性

#### 1. 思考功能
- AI会展示思考过程
- 思考内容可折叠显示
- 支持长思考内容的滚动查看

#### 2. 流式输出
- 实时显示AI回复
- 打字机效果
- 支持中断和重新开始

#### 3. 对话管理
- 自动维护对话历史
- 智能token管理
- 支持清空对话记录

### 📱 使用方法

#### 启动AI对话
1. 点击输入框右侧的 ➕ 按钮
2. 在弹出的功能菜单中选择 🤖 AI对话
3. 系统会显示"AI对话模式"指示器
4. 开始与AI聊天

#### 退出AI模式
- 点击AI模式指示器右侧的 ❌ 按钮
- 或者刷新页面

### 🔧 技术实现

#### 前端组件
- `aiService.js` - AI服务核心逻辑
- `aiChatComponent.js` - AI聊天界面组件
- `aiChat.css` - AI界面样式

#### 后端API
- `/api/ai/chat/completions` - AI聊天接口
- `/api/ai/status` - AI服务状态检查

#### 安全特性
- 通过Cloudflare Workers代理API请求
- API密钥在服务端安全存储
- 支持用户认证和权限控制

### 🧪 测试页面

访问 `/test-ai-chat.html` 进行AI功能测试：

1. **启动AI模式** - 测试AI模式切换
2. **发送测试消息** - 自动发送测试消息
3. **检查AI状态** - 验证API连接状态
4. **清空聊天** - 清除对话历史

### 📊 API参数配置

#### 默认参数
```javascript
{
  model: "deepseek-ai/DeepSeek-R1-0528-Qwen3-8B",
  stream: true,
  max_tokens: 2048,
  temperature: 0.7,
  top_p: 0.7,
  enable_thinking: true,
  thinking_budget: 4096
}
```

#### 可调整参数
- `max_tokens`: 最大输出token数 (1-4096)
- `temperature`: 创造性程度 (0-2)
- `top_p`: 核采样参数 (0-1)
- `thinking_budget`: 思考token预算 (1-8192)

### 🐛 故障排除

#### 常见问题

1. **AI无响应**
   - 检查API密钥是否正确设置
   - 验证网络连接
   - 查看浏览器控制台错误信息

2. **思考内容不显示**
   - 确认 `enable_thinking` 参数为 true
   - 检查CSS样式是否正确加载

3. **流式输出中断**
   - 检查网络稳定性
   - 验证token限制设置

#### 调试方法

1. 打开浏览器开发者工具
2. 查看Console标签页的日志信息
3. 检查Network标签页的API请求状态
4. 使用测试页面验证各项功能

### 💡 最佳实践

1. **合理设置token限制**，避免过长的对话消耗过多资源
2. **定期清空对话历史**，保持良好的性能
3. **监控API使用量**，避免超出配额限制
4. **测试不同参数组合**，找到最适合的配置

### 🔄 更新日志

- **v1.0.0** - 初始版本，支持基础AI对话功能
- 集成硅基流动DeepSeek-R1模型
- 实现思考功能和流式输出
- 添加微信风格的UI界面

### 📞 技术支持

如遇到问题，请：
1. 查看本文档的故障排除部分
2. 检查Cloudflare Workers日志
3. 验证API密钥和网络连接
4. 使用测试页面进行功能验证
