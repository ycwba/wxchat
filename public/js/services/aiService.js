/**
 * AI服务模块 - 硅基流动API集成
 * 支持DeepSeek-R1模型的对话、思考功能和流式输出
 * 
 * @author wxchat
 * @version 1.0.0
 */

class AIService {
    constructor() {
        this.apiEndpoint = '/api/ai/chat/completions'; // 使用Worker代理
        this.model = 'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B';
        this.conversationHistory = [];
        this.isStreaming = false;
    }

    /**
     * 初始化AI服务
     */
    init() {
        console.log('AI服务初始化成功');
    }

    /**
     * 发送消息到AI模型
     * @param {string} message - 用户消息
     * @param {Object} options - 配置选项
     * @returns {Promise} 响应Promise
     */
    async sendMessage(message, options = {}) {
        const defaultOptions = {
            stream: true,
            enableThinking: true,
            maxTokens: 2048,
            temperature: 0.7,
            topP: 0.7,
            thinkingBudget: 4096
        };

        const config = { ...defaultOptions, ...options };

        // 添加用户消息到对话历史
        this.addToHistory('user', message);

        const requestBody = {
            model: this.model,
            messages: this.conversationHistory,
            stream: config.stream,
            max_tokens: config.maxTokens,
            enable_thinking: config.enableThinking,
            thinking_budget: config.thinkingBudget,
            temperature: config.temperature,
            top_p: config.topP,
            response_format: {
                type: 'text'
            }
        };

        try {
            // 获取认证token
            const token = localStorage.getItem('authToken');
            
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`AI API请求失败: ${response.status} ${response.statusText}`);
            }

            if (config.stream) {
                return this.handleStreamResponse(response);
            } else {
                return this.handleNormalResponse(response);
            }
        } catch (error) {
            console.error('AI服务请求错误:', error);
            throw error;
        }
    }

    /**
     * 处理流式响应
     * @param {Response} response - fetch响应对象
     * @returns {AsyncGenerator} 流式数据生成器
     */
    async* handleStreamResponse(response) {
        this.isStreaming = true;
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let assistantMessage = '';
        let reasoningContent = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') {
                            // 流式响应结束，添加完整消息到历史
                            this.addToHistory('assistant', assistantMessage, reasoningContent);
                            yield {
                                type: 'done',
                                content: assistantMessage,
                                reasoning: reasoningContent
                            };
                            return;
                        }

                        try {
                            const parsed = JSON.parse(data);
                            const choice = parsed.choices?.[0];
                            
                            if (choice?.delta?.content) {
                                assistantMessage += choice.delta.content;
                                yield {
                                    type: 'content',
                                    content: choice.delta.content,
                                    fullContent: assistantMessage
                                };
                            }

                            if (choice?.delta?.reasoning_content) {
                                reasoningContent += choice.delta.reasoning_content;
                                yield {
                                    type: 'reasoning',
                                    reasoning: choice.delta.reasoning_content,
                                    fullReasoning: reasoningContent
                                };
                            }
                        } catch (parseError) {
                            console.warn('解析流式数据失败:', parseError);
                        }
                    }
                }
            }
        } finally {
            this.isStreaming = false;
            reader.releaseLock();
        }
    }

    /**
     * 处理普通响应
     * @param {Response} response - fetch响应对象
     * @returns {Object} 解析后的响应数据
     */
    async handleNormalResponse(response) {
        const data = await response.json();
        const choice = data.choices?.[0];
        
        if (choice?.message) {
            const content = choice.message.content || '';
            const reasoning = choice.message.reasoning_content || '';
            
            // 添加助手回复到历史
            this.addToHistory('assistant', content, reasoning);
            
            return {
                type: 'complete',
                content,
                reasoning,
                usage: data.usage
            };
        }
        
        throw new Error('AI响应格式错误');
    }

    /**
     * 添加消息到对话历史
     * @param {string} role - 角色 (user/assistant)
     * @param {string} content - 消息内容
     * @param {string} reasoning - 思考内容 (可选)
     */
    addToHistory(role, content, reasoning = '') {
        const message = {
            role,
            content
        };

        // 如果有思考内容，添加到消息中
        if (reasoning && role === 'assistant') {
            message.reasoning_content = reasoning;
        }

        this.conversationHistory.push(message);
        
        // 限制历史记录长度，避免token超限
        if (this.conversationHistory.length > 20) {
            this.conversationHistory = this.conversationHistory.slice(-20);
        }
    }

    /**
     * 清空对话历史
     */
    clearHistory() {
        this.conversationHistory = [];
        console.log('对话历史已清空');
    }

    /**
     * 获取对话历史
     * @returns {Array} 对话历史数组
     */
    getHistory() {
        return [...this.conversationHistory];
    }

    /**
     * 检查是否正在流式输出
     * @returns {boolean} 是否正在流式输出
     */
    getStreamingStatus() {
        return this.isStreaming;
    }

    /**
     * 获取服务状态
     * @returns {Object} 服务状态信息
     */
    getStatus() {
        return {
            initialized: true,
            model: this.model,
            historyLength: this.conversationHistory.length,
            isStreaming: this.isStreaming
        };
    }
}

// 导出AI服务实例
const aiService = new AIService();

// 兼容不同模块系统
if (typeof module !== 'undefined' && module.exports) {
    module.exports = aiService;
} else if (typeof window !== 'undefined') {
    window.AIService = aiService;
}
