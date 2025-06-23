// 功能菜单组件 - 微信风格功能选项弹出层
// 提供Web端适用的功能选项界面框架

const FunctionMenu = {
    // 菜单配置
    menuItems: [
        {
            id: 'quick-reply',
            icon: '💬',
            title: '快速回复',
            description: '常用回复模板',
            action: 'quickReply'
        },
        {
            id: 'emoji',
            icon: '😊',
            title: '表情符号',
            description: '插入表情',
            action: 'emoji'
        },
        {
            id: 'markdown',
            icon: '📝',
            title: 'Markdown',
            description: '格式化文本',
            action: 'markdown'
        },
        {
            id: 'code-snippet',
            icon: '💻',
            title: '代码片段',
            description: '插入代码块',
            action: 'codeSnippet'
        },
        {
            id: 'clear-chat',
            icon: '🗑️',
            title: '清空聊天',
            description: '清除所有消息',
            action: 'clearChat'
        },
        {
            id: 'settings',
            icon: '⚙️',
            title: '设置',
            description: '应用设置',
            action: 'settings'
        }
    ],

    // 组件状态
    isInitialized: false,

    // 初始化菜单
    init() {
        if (this.isInitialized) return;
        
        this.createMenuElement();
        this.bindEvents();
        this.isInitialized = true;
    },

    // 创建菜单DOM元素
    createMenuElement() {
        // 检查是否已存在
        if (document.getElementById('functionMenu')) return;

        const menuHTML = `
            <div class="function-menu" id="functionMenu">
                <div class="function-menu-content">
                    <div class="function-menu-header">
                        <h3>功能菜单</h3>
                        <button class="function-menu-close" id="functionMenuClose">
                            <svg viewBox="0 0 24 24" width="16" height="16">
                                <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="function-menu-grid">
                        ${this.generateMenuItems()}
                    </div>
                </div>
                <div class="function-menu-overlay"></div>
            </div>
        `;

        // 插入到body中
        document.body.insertAdjacentHTML('beforeend', menuHTML);
    },

    // 生成菜单项HTML
    generateMenuItems() {
        return this.menuItems.map(item => `
            <div class="function-menu-item" data-action="${item.action}" data-id="${item.id}">
                <div class="function-menu-item-icon">${item.icon}</div>
                <div class="function-menu-item-content">
                    <div class="function-menu-item-title">${item.title}</div>
                    <div class="function-menu-item-description">${item.description}</div>
                </div>
            </div>
        `).join('');
    },

    // 绑定事件
    bindEvents() {
        // 菜单项点击事件
        document.addEventListener('click', (e) => {
            const menuItem = e.target.closest('.function-menu-item');
            if (menuItem) {
                const action = menuItem.dataset.action;
                const itemId = menuItem.dataset.id;
                this.handleMenuItemClick(action, itemId);
            }
        });

        // 关闭按钮事件
        document.addEventListener('click', (e) => {
            if (e.target.closest('#functionMenuClose')) {
                this.hide();
            }
        });

        // 遮罩层点击关闭
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('function-menu-overlay')) {
                this.hide();
            }
        });
    },

    // 处理菜单项点击
    handleMenuItemClick(action, itemId) {
        // 分发自定义事件
        const event = new CustomEvent('functionMenu:itemClick', {
            detail: { action, itemId }
        });
        document.dispatchEvent(event);

        // 执行对应的动作
        this.executeAction(action, itemId);
        
        // 关闭菜单
        this.hide();
    },

    // 执行功能动作
    executeAction(action, itemId) {
        switch (action) {
            case 'quickReply':
                this.handleQuickReply();
                break;
            case 'emoji':
                this.handleEmoji();
                break;
            case 'markdown':
                this.handleMarkdown();
                break;
            case 'codeSnippet':
                this.handleCodeSnippet();
                break;
            case 'clearChat':
                this.handleClearChat();
                break;
            case 'settings':
                this.handleSettings();
                break;
            default:
                console.log(`未实现的功能: ${action}`);
        }
    },

    // 快速回复功能
    handleQuickReply() {
        const replies = ['好的', '收到', '谢谢', '没问题', '稍等一下'];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        this.insertTextToInput(randomReply);
    },

    // 表情功能
    handleEmoji() {
        const emojis = ['😊', '👍', '❤️', '😂', '🎉', '👏', '🔥', '💯'];
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        this.insertTextToInput(randomEmoji);
    },

    // Markdown功能
    handleMarkdown() {
        this.insertTextToInput('**粗体文本**');
    },

    // 代码片段功能
    handleCodeSnippet() {
        this.insertTextToInput('```\n// 代码片段\nconsole.log("Hello World");\n```');
    },

    // 清空聊天功能
    handleClearChat() {
        if (confirm('确定要清空所有聊天记录吗？')) {
            // 触发清空聊天事件
            const event = new CustomEvent('functionMenu:clearChat');
            document.dispatchEvent(event);
        }
    },

    // 设置功能
    handleSettings() {
        alert('设置功能待实现');
    },

    // 向输入框插入文本
    insertTextToInput(text) {
        const messageText = document.getElementById('messageText');
        if (!messageText) return;

        const currentValue = messageText.value;
        const cursorPos = messageText.selectionStart;
        
        const newValue = currentValue.slice(0, cursorPos) + text + currentValue.slice(cursorPos);
        messageText.value = newValue;
        
        // 设置光标位置
        const newCursorPos = cursorPos + text.length;
        messageText.setSelectionRange(newCursorPos, newCursorPos);
        
        // 触发input事件以更新UI状态
        messageText.dispatchEvent(new Event('input', { bubbles: true }));
        
        // 聚焦输入框
        messageText.focus();
    },

    // 显示菜单
    show() {
        const menu = document.getElementById('functionMenu');
        if (menu) {
            menu.classList.add('show');
        }
    },

    // 隐藏菜单
    hide() {
        const menu = document.getElementById('functionMenu');
        if (menu) {
            menu.classList.remove('show');
        }
    },

    // 添加自定义菜单项
    addMenuItem(item) {
        this.menuItems.push(item);
        if (this.isInitialized) {
            this.refreshMenu();
        }
    },

    // 刷新菜单
    refreshMenu() {
        const menuGrid = document.querySelector('.function-menu-grid');
        if (menuGrid) {
            menuGrid.innerHTML = this.generateMenuItems();
        }
    }
};

// 导出组件
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FunctionMenu;
}
