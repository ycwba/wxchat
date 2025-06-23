// 功能按钮组件 - 微信风格动态输入功能
// 实现输入框为空时显示的圆形加号按钮

const FunctionButton = {
    // 组件状态
    isVisible: true,
    isMenuOpen: false,
    
    // DOM 元素引用
    elements: {
        functionButton: null,
        functionMenu: null
    },

    // 初始化功能按钮
    init() {
        this.cacheElements();
        this.bindEvents();
        this.updateVisibility();
    },

    // 缓存DOM元素
    cacheElements() {
        this.elements.functionButton = document.getElementById('functionButton');
        this.elements.functionMenu = document.getElementById('functionMenu');
    },

    // 绑定事件
    bindEvents() {
        if (this.elements.functionButton) {
            // 点击功能按钮显示菜单
            this.elements.functionButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleMenu();
            });
        }

        // 点击其他地方关闭菜单
        document.addEventListener('click', (e) => {
            if (this.isMenuOpen && !this.isClickInsideMenu(e.target)) {
                this.hideMenu();
            }
        });

        // ESC键关闭菜单
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMenuOpen) {
                this.hideMenu();
            }
        });
    },

    // 检查点击是否在菜单内
    isClickInsideMenu(target) {
        return this.elements.functionMenu && 
               (this.elements.functionMenu.contains(target) || 
                this.elements.functionButton.contains(target));
    },

    // 显示功能按钮
    show() {
        if (!this.elements.functionButton) return;
        
        this.isVisible = true;
        this.elements.functionButton.classList.remove('hide');
        this.elements.functionButton.classList.add('show');
    },

    // 隐藏功能按钮
    hide() {
        if (!this.elements.functionButton) return;
        
        this.isVisible = false;
        this.elements.functionButton.classList.remove('show');
        this.elements.functionButton.classList.add('hide');
        
        // 如果菜单是打开的，也要关闭
        if (this.isMenuOpen) {
            this.hideMenu();
        }
    },

    // 更新可见性（根据输入框状态）
    updateVisibility() {
        const messageText = document.getElementById('messageText');
        if (!messageText) return;

        const hasContent = messageText.value.trim().length > 0;
        
        if (hasContent) {
            this.hide();
        } else {
            this.show();
        }
    },

    // 切换菜单显示状态
    toggleMenu() {
        if (this.isMenuOpen) {
            this.hideMenu();
        } else {
            this.showMenu();
        }
    },

    // 显示功能菜单
    showMenu() {
        if (!this.elements.functionMenu || this.isMenuOpen) return;

        this.isMenuOpen = true;
        this.elements.functionMenu.classList.add('show');
        
        // 添加动画效果
        requestAnimationFrame(() => {
            this.elements.functionMenu.classList.add('animate-in');
        });

        // 触发自定义事件
        this.dispatchEvent('menuOpen');
    },

    // 隐藏功能菜单
    hideMenu() {
        if (!this.elements.functionMenu || !this.isMenuOpen) return;

        this.isMenuOpen = false;
        this.elements.functionMenu.classList.remove('animate-in');
        
        // 等待动画完成后隐藏
        setTimeout(() => {
            if (!this.isMenuOpen) { // 确保在动画期间没有重新打开
                this.elements.functionMenu.classList.remove('show');
            }
        }, 200);

        // 触发自定义事件
        this.dispatchEvent('menuClose');
    },

    // 分发自定义事件
    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(`functionButton:${eventName}`, {
            detail: { ...detail, component: this }
        });
        document.dispatchEvent(event);
    },

    // 获取当前状态
    getState() {
        return {
            isVisible: this.isVisible,
            isMenuOpen: this.isMenuOpen
        };
    },

    // 重置组件状态
    reset() {
        this.hideMenu();
        this.updateVisibility();
    }
};

// 导出组件（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FunctionButton;
}
