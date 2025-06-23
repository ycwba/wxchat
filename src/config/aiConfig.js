/**
 * AI配置模块
 * 管理AI服务的配置参数和环境变量
 * 
 * @author wxchat
 * @version 1.0.0
 */

const AIConfig = {
    // API配置
    api: {
        endpoint: 'https://api.siliconflow.cn/v1/chat/completions',
        model: 'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B',
        timeout: 30000, // 30秒超时
        retryAttempts: 3,
        retryDelay: 1000 // 1秒重试延迟
    },

    // 模型参数配置
    modelParams: {
        // 基础参数
        maxTokens: 2048,
        temperature: 0.7,
        topP: 0.7,
        topK: 50,
        frequencyPenalty: 0.5,
        
        // 思考功能参数
        enableThinking: true,
        thinkingBudget: 4096,
        
        // 流式输出
        stream: true,
        
        // 响应格式
        responseFormat: {
            type: 'text'
        }
    },

    // UI配置
    ui: {
        // 思考内容显示配置
        thinking: {
            collapsible: true,
            defaultCollapsed: true,
            maxDisplayLength: 500,
            showToggleButton: true
        },
        
        // 流式输出配置
        streaming: {
            typingSpeed: 50, // 打字机效果速度 (ms)
            chunkSize: 1, // 每次显示的字符数
            showCursor: true
        },
        
        // 消息样式配置
        message: {
            maxWidth: '80%',
            borderRadius: '12px',
            padding: '12px 16px',
            margin: '8px 0'
        }
    },

    // 错误处理配置
    errorHandling: {
        showErrorDetails: false, // 生产环境设为false
        fallbackMessage: '抱歉，AI服务暂时不可用，请稍后再试。',
        retryMessage: '正在重试...',
        networkErrorMessage: '网络连接失败，请检查网络设置。'
    },

    // 安全配置
    security: {
        maxMessageLength: 4000,
        maxHistoryLength: 20,
        rateLimitPerMinute: 10,
        contentFilter: true
    },

    // 开发配置
    development: {
        enableDebugLog: true,
        mockResponse: false,
        showApiCalls: true
    },

    /**
     * 获取环境变量
     * @param {string} key - 环境变量键名
     * @param {string} defaultValue - 默认值
     * @returns {string} 环境变量值
     */
    getEnvVar(key, defaultValue = '') {
        // Cloudflare Workers环境
        if (typeof globalThis !== 'undefined' && globalThis.env) {
            return globalThis.env[key] || defaultValue;
        }
        
        // Node.js环境
        if (typeof process !== 'undefined' && process.env) {
            return process.env[key] || defaultValue;
        }
        
        // 浏览器环境 (开发时)
        if (typeof window !== 'undefined' && window.env) {
            return window.env[key] || defaultValue;
        }
        
        return defaultValue;
    },

    /**
     * 获取API密钥
     * @returns {string} API密钥
     */
    getApiKey() {
        return this.getEnvVar('SILICONFLOW_API_KEY', '');
    },

    /**
     * 验证配置
     * @returns {Object} 验证结果
     */
    validateConfig() {
        const errors = [];
        const warnings = [];

        // 检查API密钥
        const apiKey = this.getApiKey();
        if (!apiKey) {
            errors.push('SILICONFLOW_API_KEY 环境变量未设置');
        } else if (apiKey.length < 10) {
            warnings.push('API密钥长度可能不正确');
        }

        // 检查模型参数
        if (this.modelParams.maxTokens > 8192) {
            warnings.push('maxTokens 设置过高，可能影响响应速度');
        }

        if (this.modelParams.temperature < 0 || this.modelParams.temperature > 2) {
            errors.push('temperature 参数应在 0-2 之间');
        }

        if (this.modelParams.thinkingBudget > 8192) {
            warnings.push('thinkingBudget 设置过高，可能增加成本');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    },

    /**
     * 获取运行时配置
     * @returns {Object} 运行时配置对象
     */
    getRuntimeConfig() {
        return {
            apiKey: this.getApiKey(),
            endpoint: this.api.endpoint,
            model: this.api.model,
            params: { ...this.modelParams },
            ui: { ...this.ui },
            security: { ...this.security }
        };
    },

    /**
     * 更新配置
     * @param {Object} updates - 配置更新对象
     */
    updateConfig(updates) {
        if (updates.modelParams) {
            Object.assign(this.modelParams, updates.modelParams);
        }
        
        if (updates.ui) {
            Object.assign(this.ui, updates.ui);
        }
        
        if (updates.security) {
            Object.assign(this.security, updates.security);
        }
        
        console.log('AI配置已更新:', updates);
    },

    /**
     * 重置为默认配置
     */
    resetToDefaults() {
        // 重置模型参数
        this.modelParams = {
            maxTokens: 2048,
            temperature: 0.7,
            topP: 0.7,
            topK: 50,
            frequencyPenalty: 0.5,
            enableThinking: true,
            thinkingBudget: 4096,
            stream: true,
            responseFormat: { type: 'text' }
        };
        
        console.log('AI配置已重置为默认值');
    },

    /**
     * 获取调试信息
     * @returns {Object} 调试信息
     */
    getDebugInfo() {
        return {
            config: this.getRuntimeConfig(),
            validation: this.validateConfig(),
            environment: {
                hasApiKey: !!this.getApiKey(),
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
                timestamp: new Date().toISOString()
            }
        };
    }
};

// 导出配置对象
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIConfig;
} else if (typeof window !== 'undefined') {
    window.AIConfig = AIConfig;
}
