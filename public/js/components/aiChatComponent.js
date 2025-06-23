/**
 * AI聊天组件
 * 提供AI对话界面，支持思考内容折叠显示和流式输出
 * 
 * @author wxchat
 * @version 1.0.0
 */

class AIChatComponent {
    constructor() {
        this.isInitialized = false;
        this.isAIMode = false;
        this.currentStreamingMessage = null;
        this.messageCounter = 0;
    }

    /**
     * 初始化AI聊天组件
     */
    init() {
        if (this.isInitialized) return;
        
        this.createAIElements();
        this.bindEvents();
        this.isInitialized = true;
        
        console.log('AI聊天组件初始化完成');
    }

    /**
     * 创建AI相关的DOM元素
     */
    createAIElements() {
        // 创建AI模式指示器
        const aiIndicator = document.createElement('div');
        aiIndicator.id = 'aiModeIndicator';
        aiIndicator.className = 'ai-mode-indicator hidden';
        aiIndicator.innerHTML = `
            <div class="ai-indicator-content">
                <div class="ai-indicator-icon">🤖</div>
                <div class="ai-indicator-text">AI对话模式</div>
                <button class="ai-indicator-close" id="aiModeClose">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                        <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                    </svg>
                </button>
            </div>
        `;
        
        // 插入到消息列表上方
        const messageList = document.getElementById('messageList');
        if (messageList) {
            messageList.parentNode.insertBefore(aiIndicator, messageList);
        }
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // AI模式关闭按钮
        const aiModeClose = document.getElementById('aiModeClose');
        if (aiModeClose) {
            aiModeClose.addEventListener('click', () => {
                this.exitAIMode();
            });
        }

        // 监听AI功能菜单点击
        document.addEventListener('functionMenu:itemClick', (e) => {
            if (e.detail.action === 'ai') {
                this.enterAIMode();
            }
        });

        // 监听消息发送前事件
        document.addEventListener('message:beforeSend', (e) => {
            if (this.isAIMode) {
                e.preventDefault();
                this.handleAIMessage(e.detail.message);
            }
        });
    }

    /**
     * 进入AI对话模式
     */
    enterAIMode() {
        this.isAIMode = true;
        
        // 显示AI模式指示器
        const indicator = document.getElementById('aiModeIndicator');
        if (indicator) {
            indicator.classList.remove('hidden');
        }

        // 添加AI欢迎消息
        this.addAIWelcomeMessage();
        
        // 更新输入框占位符
        const messageText = document.getElementById('messageText');
        if (messageText) {
            messageText.placeholder = '与AI对话...';
        }

        console.log('已进入AI对话模式');
    }

    /**
     * 退出AI对话模式
     */
    exitAIMode() {
        this.isAIMode = false;
        
        // 隐藏AI模式指示器
        const indicator = document.getElementById('aiModeIndicator');
        if (indicator) {
            indicator.classList.add('hidden');
        }

        // 恢复输入框占位符
        const messageText = document.getElementById('messageText');
        if (messageText) {
            messageText.placeholder = '输入消息...';
        }

        // 停止当前流式输出
        if (this.currentStreamingMessage) {
            this.stopStreaming();
        }

        console.log('已退出AI对话模式');
    }

    /**
     * 添加AI欢迎消息
     */
    addAIWelcomeMessage() {
        const welcomeMessage = {
            id: `ai-welcome-${Date.now()}`,
            type: 'ai',
            content: '你好！我是AI助手，有什么可以帮助你的吗？',
            timestamp: new Date().toISOString(),
            isWelcome: true
        };

        this.displayMessage(welcomeMessage);
    }

    /**
     * 处理AI消息
     * @param {string} userMessage - 用户消息
     */
    async handleAIMessage(userMessage) {
        try {
            // 显示用户消息
            this.displayMessage({
                id: `user-${Date.now()}`,
                type: 'user',
                content: userMessage,
                timestamp: new Date().toISOString()
            });

            // 显示AI思考状态
            const thinkingMessage = this.showThinkingStatus();

            // 发送到AI服务
            const aiService = window.AIService;
            if (!aiService) {
                throw new Error('AI服务未初始化');
            }

            // 创建AI响应消息容器
            const aiMessageId = `ai-${Date.now()}`;
            const aiMessage = {
                id: aiMessageId,
                type: 'ai',
                content: '',
                reasoning: '',
                timestamp: new Date().toISOString(),
                isStreaming: true
            };

            // 移除思考状态，显示AI消息容器
            this.removeMessage(thinkingMessage.id);
            this.displayMessage(aiMessage);

            // 开始流式接收
            this.currentStreamingMessage = aiMessage;
            const streamGenerator = await aiService.sendMessage(userMessage);

            for await (const chunk of streamGenerator) {
                if (!this.isAIMode) break; // 如果退出AI模式，停止处理

                switch (chunk.type) {
                    case 'reasoning':
                        this.updateMessageReasoning(aiMessageId, chunk.fullReasoning);
                        break;
                    case 'content':
                        this.updateMessageContent(aiMessageId, chunk.fullContent);
                        break;
                    case 'done':
                        this.finishStreamingMessage(aiMessageId);
                        break;
                }
            }

        } catch (error) {
            console.error('AI消息处理错误:', error);
            this.showErrorMessage(error.message);
        }
    }

    /**
     * 显示思考状态
     * @returns {Object} 思考消息对象
     */
    showThinkingStatus() {
        const thinkingMessage = {
            id: `thinking-${Date.now()}`,
            type: 'thinking',
            content: '🤔 AI正在思考...',
            timestamp: new Date().toISOString()
        };

        this.displayMessage(thinkingMessage);
        return thinkingMessage;
    }

    /**
     * 显示消息
     * @param {Object} message - 消息对象
     */
    displayMessage(message) {
        const messageList = document.getElementById('messageList');
        if (!messageList) return;

        const messageElement = this.createMessageElement(message);
        messageList.appendChild(messageElement);
        messageList.scrollTop = messageList.scrollHeight;
    }

    /**
     * 创建消息元素
     * @param {Object} message - 消息对象
     * @returns {HTMLElement} 消息DOM元素
     */
    createMessageElement(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.type}-message`;
        messageDiv.id = `message-${message.id}`;

        let contentHTML = '';

        if (message.type === 'ai') {
            contentHTML = `
                <div class="message-avatar">🤖</div>
                <div class="message-content">
                    ${message.reasoning ? this.createReasoningHTML(message.reasoning) : ''}
                    <div class="message-text" id="content-${message.id}">${message.content}</div>
                    ${message.isStreaming ? '<span class="typing-cursor">|</span>' : ''}
                </div>
            `;
        } else if (message.type === 'user') {
            contentHTML = `
                <div class="message-content">
                    <div class="message-text">${this.escapeHtml(message.content)}</div>
                </div>
                <div class="message-avatar">👤</div>
            `;
        } else if (message.type === 'thinking') {
            contentHTML = `
                <div class="message-avatar">🤖</div>
                <div class="message-content thinking-content">
                    <div class="message-text">${message.content}</div>
                    <div class="thinking-animation">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            `;
        } else if (message.type === 'error') {
            contentHTML = `
                <div class="message-avatar">⚠️</div>
                <div class="message-content error-content">
                    <div class="message-text">${this.escapeHtml(message.content)}</div>
                </div>
            `;
        }

        messageDiv.innerHTML = contentHTML;
        return messageDiv;
    }

    /**
     * 创建思考内容HTML
     * @param {string} reasoning - 思考内容
     * @returns {string} 思考内容HTML
     */
    createReasoningHTML(reasoning) {
        if (!reasoning) return '';

        const isLong = reasoning.length > 200;
        
        return `
            <div class="reasoning-content ${isLong ? 'collapsible' : ''}" id="reasoning-${this.messageCounter++}">
                <div class="reasoning-header">
                    <span class="reasoning-icon">💭</span>
                    <span class="reasoning-title">AI思考过程</span>
                    ${isLong ? '<button class="reasoning-toggle">展开</button>' : ''}
                </div>
                <div class="reasoning-text ${isLong ? 'collapsed' : ''}">${this.escapeHtml(reasoning)}</div>
            </div>
        `;
    }

    /**
     * 更新消息内容
     * @param {string} messageId - 消息ID
     * @param {string} content - 新内容
     */
    updateMessageContent(messageId, content) {
        const contentElement = document.getElementById(`content-${messageId}`);
        if (contentElement) {
            contentElement.textContent = content;
        }
    }

    /**
     * 更新消息思考内容
     * @param {string} messageId - 消息ID
     * @param {string} reasoning - 思考内容
     */
    updateMessageReasoning(messageId, reasoning) {
        const messageElement = document.getElementById(`message-${messageId}`);
        if (messageElement && reasoning) {
            const existingReasoning = messageElement.querySelector('.reasoning-content');
            if (existingReasoning) {
                existingReasoning.remove();
            }

            const reasoningHTML = this.createReasoningHTML(reasoning);
            const messageContent = messageElement.querySelector('.message-content');
            if (messageContent) {
                messageContent.insertAdjacentHTML('afterbegin', reasoningHTML);
            }
        }
    }

    /**
     * 完成流式消息
     * @param {string} messageId - 消息ID
     */
    finishStreamingMessage(messageId) {
        const messageElement = document.getElementById(`message-${messageId}`);
        if (messageElement) {
            // 移除打字光标
            const cursor = messageElement.querySelector('.typing-cursor');
            if (cursor) {
                cursor.remove();
            }
        }

        this.currentStreamingMessage = null;
    }

    /**
     * 移除消息
     * @param {string} messageId - 消息ID
     */
    removeMessage(messageId) {
        const messageElement = document.getElementById(`message-${messageId}`);
        if (messageElement) {
            messageElement.remove();
        }
    }

    /**
     * 显示错误消息
     * @param {string} errorMessage - 错误信息
     */
    showErrorMessage(errorMessage) {
        const errorMsg = {
            id: `error-${Date.now()}`,
            type: 'error',
            content: `❌ ${errorMessage}`,
            timestamp: new Date().toISOString()
        };

        this.displayMessage(errorMsg);
    }

    /**
     * 停止流式输出
     */
    stopStreaming() {
        if (this.currentStreamingMessage) {
            this.finishStreamingMessage(this.currentStreamingMessage.id);
        }
    }

    /**
     * HTML转义
     * @param {string} text - 原始文本
     * @returns {string} 转义后的文本
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 获取AI模式状态
     * @returns {boolean} 是否在AI模式
     */
    isInAIMode() {
        return this.isAIMode;
    }
}

// 导出组件
const aiChatComponent = new AIChatComponent();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = aiChatComponent;
} else if (typeof window !== 'undefined') {
    window.AIChatComponent = aiChatComponent;
}
