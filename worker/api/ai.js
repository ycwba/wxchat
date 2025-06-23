/**
 * AI API处理模块 - Cloudflare Workers
 * 处理硅基流动AI API的代理请求
 * 
 * @author wxchat
 * @version 1.0.0
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';

const ai = new Hono();

// 配置CORS
ai.use('/*', cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
}));

/**
 * AI聊天完成接口
 * POST /api/ai/chat/completions
 */
ai.post('/chat/completions', async (c) => {
    try {
        // 验证环境变量
        const apiKey = c.env.SILICONFLOW_API_KEY;
        if (!apiKey) {
            return c.json({
                error: 'AI服务配置错误',
                message: 'SILICONFLOW_API_KEY 环境变量未设置'
            }, 500);
        }

        // 获取请求体
        const requestBody = await c.req.json();
        
        // 验证请求参数
        const validation = validateChatRequest(requestBody);
        if (!validation.isValid) {
            return c.json({
                error: '请求参数错误',
                message: validation.message
            }, 400);
        }

        // 构建发送到硅基流动的请求
        const aiRequest = buildAIRequest(requestBody);
        
        // 发送请求到硅基流动API
        const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(aiRequest)
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('硅基流动API错误:', response.status, errorData);
            
            return c.json({
                error: 'AI服务请求失败',
                message: `API返回错误: ${response.status}`,
                details: response.status >= 500 ? null : errorData
            }, response.status);
        }

        // 处理流式响应
        if (aiRequest.stream) {
            return handleStreamResponse(c, response);
        } else {
            // 处理普通响应
            const data = await response.json();
            return c.json(data);
        }

    } catch (error) {
        console.error('AI API处理错误:', error);
        return c.json({
            error: '服务器内部错误',
            message: error.message
        }, 500);
    }
});

/**
 * 获取AI服务状态
 * GET /api/ai/status
 */
ai.get('/status', async (c) => {
    const hasApiKey = !!c.env.SILICONFLOW_API_KEY;
    
    return c.json({
        status: 'ok',
        service: 'SiliconFlow AI',
        model: 'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B',
        configured: hasApiKey,
        timestamp: new Date().toISOString()
    });
});

/**
 * 验证聊天请求参数
 * @param {Object} request - 请求对象
 * @returns {Object} 验证结果
 */
function validateChatRequest(request) {
    if (!request.messages || !Array.isArray(request.messages)) {
        return {
            isValid: false,
            message: 'messages 参数必须是数组'
        };
    }

    if (request.messages.length === 0) {
        return {
            isValid: false,
            message: 'messages 不能为空'
        };
    }

    // 验证消息格式
    for (const message of request.messages) {
        if (!message.role || !message.content) {
            return {
                isValid: false,
                message: '消息必须包含 role 和 content 字段'
            };
        }

        if (!['user', 'assistant', 'system'].includes(message.role)) {
            return {
                isValid: false,
                message: 'role 必须是 user、assistant 或 system'
            };
        }
    }

    // 验证token限制
    const totalLength = request.messages.reduce((sum, msg) => sum + msg.content.length, 0);
    if (totalLength > 10000) {
        return {
            isValid: false,
            message: '消息总长度超过限制'
        };
    }

    return { isValid: true };
}

/**
 * 构建AI请求对象
 * @param {Object} request - 原始请求
 * @returns {Object} AI请求对象
 */
function buildAIRequest(request) {
    return {
        model: 'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B',
        messages: request.messages,
        stream: request.stream !== false, // 默认启用流式
        max_tokens: Math.min(request.max_tokens || 2048, 4096),
        temperature: Math.max(0, Math.min(request.temperature || 0.7, 2)),
        top_p: Math.max(0, Math.min(request.top_p || 0.7, 1)),
        enable_thinking: request.enable_thinking !== false, // 默认启用思考
        thinking_budget: Math.min(request.thinking_budget || 4096, 8192),
        response_format: {
            type: 'text'
        }
    };
}

/**
 * 处理流式响应
 * @param {Object} c - Hono上下文
 * @param {Response} response - 硅基流动响应
 * @returns {Response} 流式响应
 */
function handleStreamResponse(c, response) {
    // 设置流式响应头
    const headers = new Headers({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });

    // 创建可读流
    const readable = new ReadableStream({
        start(controller) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            function pump() {
                return reader.read().then(({ done, value }) => {
                    if (done) {
                        controller.close();
                        return;
                    }

                    // 解码并转发数据
                    const chunk = decoder.decode(value, { stream: true });
                    controller.enqueue(new TextEncoder().encode(chunk));
                    
                    return pump();
                }).catch(error => {
                    console.error('流式响应处理错误:', error);
                    controller.error(error);
                });
            }

            return pump();
        }
    });

    return new Response(readable, { headers });
}

/**
 * 错误处理中间件
 */
ai.onError((err, c) => {
    console.error('AI API错误:', err);
    return c.json({
        error: '服务器错误',
        message: err.message,
        timestamp: new Date().toISOString()
    }, 500);
});

export default ai;
