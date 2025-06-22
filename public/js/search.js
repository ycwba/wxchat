// 搜索功能管理器
class SearchManager {
    constructor() {
        this.isSearchMode = false;
        this.searchResults = [];
        this.currentQuery = '';
        this.searchHistory = [];
        this.maxHistoryItems = 10;
    }

    // 初始化搜索功能
    init() {
        this.createSearchUI();
        this.bindEvents();
        this.loadSearchHistory();
    }

    // 创建搜索界面
    createSearchUI() {
        const chatContainer = document.querySelector('.chat-container');
        
        // 创建搜索栏
        const searchBar = document.createElement('div');
        searchBar.className = 'search-bar hidden';
        searchBar.innerHTML = `
            <div class="search-input-container">
                <input type="text" id="searchInput" placeholder="搜索消息和文件..." autocomplete="off">
                <button type="button" id="searchButton" class="search-btn">
                    <span class="icon">🔍</span>
                </button>
                <button type="button" id="closeSearchButton" class="close-search-btn">
                    <span class="icon">✕</span>
                </button>
            </div>
            <div class="search-filters">
                <label class="filter-option">
                    <input type="radio" name="searchType" value="all" checked>
                    <span>全部</span>
                </label>
                <label class="filter-option">
                    <input type="radio" name="searchType" value="text">
                    <span>文本</span>
                </label>
                <label class="filter-option">
                    <input type="radio" name="searchType" value="file">
                    <span>文件</span>
                </label>
            </div>
            <div class="search-results-info hidden">
                <span id="searchResultsCount">找到 0 条结果</span>
                <button type="button" id="clearSearchButton" class="clear-search-btn">清除</button>
            </div>
        `;

        // 插入到聊天容器顶部
        chatContainer.insertBefore(searchBar, chatContainer.firstChild);
        this.searchBar = searchBar;
    }

    // 绑定事件
    bindEvents() {
        const searchInput = document.getElementById('searchInput');
        const searchButton = document.getElementById('searchButton');
        const closeSearchButton = document.getElementById('closeSearchButton');
        const clearSearchButton = document.getElementById('clearSearchButton');

        // 搜索输入事件
        searchInput.addEventListener('input', (e) => {
            this.handleSearchInput(e.target.value);
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.performSearch(e.target.value);
            } else if (e.key === 'Escape') {
                this.closeSearch();
            }
        });

        // 搜索按钮
        searchButton.addEventListener('click', () => {
            this.performSearch(searchInput.value);
        });

        // 关闭搜索
        closeSearchButton.addEventListener('click', () => {
            this.closeSearch();
        });

        // 清除搜索
        clearSearchButton.addEventListener('click', () => {
            this.clearSearch();
        });

        // 搜索类型筛选
        document.querySelectorAll('input[name="searchType"]').forEach(radio => {
            radio.addEventListener('change', () => {
                if (this.currentQuery) {
                    this.performSearch(this.currentQuery);
                }
            });
        });

        // 全局快捷键
        document.addEventListener('keydown', (e) => {
            // Ctrl+F 或 Cmd+F 打开搜索
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                this.openSearch();
            }
        });
    }

    // 打开搜索
    openSearch() {
        this.isSearchMode = true;
        this.searchBar.classList.remove('hidden');
        document.getElementById('searchInput').focus();
        
        // 添加搜索模式样式
        document.body.classList.add('search-mode');
    }

    // 关闭搜索
    closeSearch() {
        this.isSearchMode = false;
        this.searchBar.classList.add('hidden');
        this.clearSearch();
        
        // 移除搜索模式样式
        document.body.classList.remove('search-mode');
    }

    // 处理搜索输入
    handleSearchInput(query) {
        // 实时搜索（防抖）
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            if (query.trim()) {
                this.performSearch(query);
            } else {
                this.clearSearch();
            }
        }, 300);
    }

    // 执行搜索
    async performSearch(query) {
        if (!query.trim()) {
            this.clearSearch();
            return;
        }

        this.currentQuery = query;
        
        try {
            // 显示加载状态
            this.showSearchLoading();

            // 获取搜索类型
            const searchType = document.querySelector('input[name="searchType"]:checked').value;

            // 调用搜索API
            const results = await this.searchMessages(query, searchType);
            
            // 显示搜索结果
            this.displaySearchResults(results);
            
            // 保存到搜索历史
            this.addToSearchHistory(query);

        } catch (error) {
            console.error('搜索失败:', error);
            this.showSearchError('搜索失败，请重试');
        }
    }

    // 搜索消息API
    async searchMessages(query, type = 'all') {
        // 这里可以调用后端搜索API，目前使用前端搜索
        const allMessages = MessageHandler.lastMessages || [];
        
        const results = allMessages.filter(message => {
            // 类型筛选
            if (type !== 'all' && message.type !== type) {
                return false;
            }

            // 内容匹配
            const searchText = query.toLowerCase();
            
            if (message.type === 'text') {
                return message.content && message.content.toLowerCase().includes(searchText);
            } else if (message.type === 'file') {
                return message.original_name && message.original_name.toLowerCase().includes(searchText);
            }
            
            return false;
        });

        return results;
    }

    // 显示搜索结果
    displaySearchResults(results) {
        this.searchResults = results;
        
        // 更新结果计数
        const countElement = document.getElementById('searchResultsCount');
        countElement.textContent = `找到 ${results.length} 条结果`;
        
        // 显示结果信息
        document.querySelector('.search-results-info').classList.remove('hidden');

        // 高亮显示搜索结果
        this.highlightSearchResults(results);
    }

    // 高亮搜索结果
    highlightSearchResults(results) {
        // 清除之前的高亮
        this.clearHighlights();

        if (results.length === 0) {
            UI.showEmpty('没有找到匹配的结果');
            return;
        }

        // 高亮匹配的消息
        results.forEach(message => {
            const messageElement = document.querySelector(`[data-message-id="${message.id}"]`);
            if (messageElement) {
                messageElement.classList.add('search-highlight');
                
                // 高亮匹配的文本
                this.highlightText(messageElement, this.currentQuery);
            }
        });

        // 滚动到第一个结果
        if (results.length > 0) {
            const firstResult = document.querySelector(`[data-message-id="${results[0].id}"]`);
            if (firstResult) {
                firstResult.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }

    // 高亮文本
    highlightText(element, query) {
        const textNodes = this.getTextNodes(element);
        const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');

        textNodes.forEach(node => {
            const parent = node.parentNode;
            const text = node.textContent;
            
            if (regex.test(text)) {
                const highlightedHTML = text.replace(regex, '<mark class="search-match">$1</mark>');
                const wrapper = document.createElement('span');
                wrapper.innerHTML = highlightedHTML;
                
                parent.replaceChild(wrapper, node);
            }
        });
    }

    // 获取文本节点
    getTextNodes(element) {
        const textNodes = [];
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }

        return textNodes;
    }

    // 转义正则表达式特殊字符
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // 清除搜索
    clearSearch() {
        this.currentQuery = '';
        this.searchResults = [];
        
        // 清空输入框
        document.getElementById('searchInput').value = '';
        
        // 隐藏结果信息
        document.querySelector('.search-results-info').classList.add('hidden');
        
        // 清除高亮
        this.clearHighlights();
        
        // 重新渲染消息列表
        if (MessageHandler.lastMessages.length > 0) {
            UI.renderMessages(MessageHandler.lastMessages, false);
        }
    }

    // 清除高亮
    clearHighlights() {
        // 移除高亮样式
        document.querySelectorAll('.search-highlight').forEach(el => {
            el.classList.remove('search-highlight');
        });

        // 移除文本高亮
        document.querySelectorAll('.search-match').forEach(mark => {
            const parent = mark.parentNode;
            parent.replaceChild(document.createTextNode(mark.textContent), mark);
            parent.normalize();
        });
    }

    // 显示搜索加载状态
    showSearchLoading() {
        const countElement = document.getElementById('searchResultsCount');
        countElement.textContent = '搜索中...';
        document.querySelector('.search-results-info').classList.remove('hidden');
    }

    // 显示搜索错误
    showSearchError(message) {
        const countElement = document.getElementById('searchResultsCount');
        countElement.textContent = message;
        document.querySelector('.search-results-info').classList.remove('hidden');
    }

    // 添加到搜索历史
    addToSearchHistory(query) {
        if (!query.trim()) return;

        // 移除重复项
        this.searchHistory = this.searchHistory.filter(item => item !== query);
        
        // 添加到开头
        this.searchHistory.unshift(query);
        
        // 限制历史记录数量
        if (this.searchHistory.length > this.maxHistoryItems) {
            this.searchHistory = this.searchHistory.slice(0, this.maxHistoryItems);
        }

        // 保存到本地存储
        this.saveSearchHistory();
    }

    // 保存搜索历史
    saveSearchHistory() {
        try {
            localStorage.setItem('wxchat_search_history', JSON.stringify(this.searchHistory));
        } catch (error) {
            console.error('保存搜索历史失败:', error);
        }
    }

    // 加载搜索历史
    loadSearchHistory() {
        try {
            const saved = localStorage.getItem('wxchat_search_history');
            if (saved) {
                this.searchHistory = JSON.parse(saved);
            }
        } catch (error) {
            console.error('加载搜索历史失败:', error);
            this.searchHistory = [];
        }
    }

    // 获取搜索历史
    getSearchHistory() {
        return this.searchHistory;
    }

    // 清除搜索历史
    clearSearchHistory() {
        this.searchHistory = [];
        this.saveSearchHistory();
    }
}

// 创建全局搜索实例
const Search = new SearchManager();

// 导出到全局
window.Search = Search;
