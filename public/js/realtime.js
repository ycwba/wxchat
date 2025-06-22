// 实时通信管理器
class RealtimeManager {
    constructor() {
        this.eventSource = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000; // 1秒
        this.deviceId = null;
        this.listeners = new Map();
    }

    // 初始化实时连接
    init(deviceId) {
        this.deviceId = deviceId;
        this.connect();
    }

    // 建立SSE连接
    connect() {
        if (this.eventSource) {
            this.disconnect();
        }

        try {
            const url = `/api/events?deviceId=${encodeURIComponent(this.deviceId)}`;
            this.eventSource = new EventSource(url);

            // 连接成功
            this.eventSource.addEventListener('connection', (event) => {
                console.log('🔗 实时连接已建立');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.emit('connected');
                UI.setConnectionStatus('connected');
            });

            // 接收消息
            this.eventSource.addEventListener('message', (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('📨 收到实时消息:', data);
                    
                    if (data.newMessages > 0) {
                        // 有新消息，触发刷新
                        this.emit('newMessages', data);
                        MessageHandler.loadMessages();
                    }
                } catch (error) {
                    console.error('解析实时消息失败:', error);
                }
            });

            // 心跳检测
            this.eventSource.addEventListener('heartbeat', (event) => {
                console.log('💓 收到心跳');
                this.emit('heartbeat');
            });

            // 连接错误
            this.eventSource.onerror = (event) => {
                console.error('❌ 实时连接错误:', event);
                this.isConnected = false;
                this.emit('disconnected');
                UI.setConnectionStatus('disconnected');
                
                // 自动重连
                this.handleReconnect();
            };

        } catch (error) {
            console.error('创建SSE连接失败:', error);
            this.handleReconnect();
        }
    }

    // 断开连接
    disconnect() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
        this.isConnected = false;
        this.emit('disconnected');
    }

    // 处理重连逻辑
    handleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ 达到最大重连次数，停止重连');
            UI.setConnectionStatus('failed');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // 指数退避

        console.log(`🔄 ${delay}ms后尝试第${this.reconnectAttempts}次重连...`);
        UI.setConnectionStatus('reconnecting');

        setTimeout(() => {
            if (!this.isConnected) {
                this.connect();
            }
        }, delay);
    }

    // 检查连接状态
    isConnectionAlive() {
        return this.isConnected && this.eventSource && this.eventSource.readyState === EventSource.OPEN;
    }

    // 事件监听器
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    // 移除事件监听器
    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    // 触发事件
    emit(event, data = null) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`事件回调执行失败 [${event}]:`, error);
                }
            });
        }
    }

    // 手动触发消息检查
    checkMessages() {
        if (this.isConnectionAlive()) {
            // SSE连接正常，等待服务器推送
            return;
        }
        
        // SSE连接异常，降级到轮询
        console.log('🔄 SSE连接异常，使用轮询模式');
        MessageHandler.loadMessages();
    }

    // 获取连接状态
    getStatus() {
        if (!this.eventSource) return 'disconnected';
        
        switch (this.eventSource.readyState) {
            case EventSource.CONNECTING:
                return 'connecting';
            case EventSource.OPEN:
                return 'connected';
            case EventSource.CLOSED:
                return 'disconnected';
            default:
                return 'unknown';
        }
    }

    // 销毁管理器
    destroy() {
        this.disconnect();
        this.listeners.clear();
        this.deviceId = null;
        this.reconnectAttempts = 0;
    }
}

// 创建全局实例
const Realtime = new RealtimeManager();

// 网络状态监听
window.addEventListener('online', () => {
    console.log('🌐 网络已连接');
    if (!Realtime.isConnectionAlive()) {
        Realtime.connect();
    }
});

window.addEventListener('offline', () => {
    console.log('📴 网络已断开');
    UI.setConnectionStatus('offline');
});

// 页面可见性变化监听
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        // 页面变为可见时，检查连接状态
        if (!Realtime.isConnectionAlive()) {
            console.log('👁️ 页面可见，检查连接状态');
            Realtime.connect();
        }
    }
});

// 导出到全局
window.Realtime = Realtime;
