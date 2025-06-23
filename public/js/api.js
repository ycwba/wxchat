// API 接口封装

const API = {
    // 通用请求方法
    async request(url, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        // 添加认证头
        const authHeaders = Auth ? Auth.addAuthHeader(defaultOptions.headers) : defaultOptions.headers;

        const config = {
            ...defaultOptions,
            ...options,
            headers: {
                ...authHeaders,
                ...options.headers,
            },
        };
        
        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            
            return response;
        } catch (error) {
            console.error('API请求失败:', error);
            throw error;
        }
    },
    
    // GET 请求
    async get(url, params = {}) {
        const urlParams = new URLSearchParams(params);
        const fullUrl = urlParams.toString() ? `${url}?${urlParams}` : url;
        
        return this.request(fullUrl, {
            method: 'GET',
        });
    },
    
    // POST 请求
    async post(url, data = {}) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
    
    // 文件上传请求
    async upload(url, formData) {
        return this.request(url, {
            method: 'POST',
            headers: {}, // 让浏览器自动设置Content-Type
            body: formData,
        });
    },
    
    // 获取消息列表
    async getMessages(limit = CONFIG.UI.MESSAGE_LOAD_LIMIT, offset = 0) {
        try {
            console.log('🔄 正在获取消息...', { limit, offset });
            const response = await this.get(CONFIG.API.ENDPOINTS.MESSAGES, {
                limit,
                offset
            });

            console.log('📥 API响应:', response);

            if (response && response.success) {
                const messages = response.data || [];
                console.log('✅ 获取到消息:', messages.length, '条');
                console.log('📋 消息详情:', messages);
                return messages;
            } else {
                console.error('❌ API返回失败:', response);
                throw new Error(response?.error || CONFIG.ERRORS.LOAD_MESSAGES_FAILED);
            }
        } catch (error) {
            console.error('💥 获取消息失败:', error);
            // 静默处理所有错误，返回空数组，让UI显示空状态
            console.log('🔄 API错误，返回空消息列表以避免显示加载状态');
            return [];
        }
    },
    
    // 发送文本消息
    async sendMessage(content, deviceId) {
        try {
            const response = await this.post(CONFIG.API.ENDPOINTS.MESSAGES, {
                content,
                deviceId
            });
            
            if (response.success) {
                return response.data;
            } else {
                throw new Error(response.error || CONFIG.ERRORS.MESSAGE_SEND_FAILED);
            }
        } catch (error) {
            console.error('发送消息失败:', error);
            throw new Error(CONFIG.ERRORS.MESSAGE_SEND_FAILED);
        }
    },
    
    // 上传文件
    async uploadFile(file, deviceId, onProgress = null) {
        try {
            // 验证文件大小
            if (!Utils.validateFileSize(file.size)) {
                throw new Error(CONFIG.ERRORS.FILE_TOO_LARGE);
            }
            
            const formData = new FormData();
            formData.append('file', file);
            formData.append('deviceId', deviceId);
            
            // 如果需要进度回调，可以使用XMLHttpRequest
            if (onProgress) {
                return this.uploadWithProgress(CONFIG.API.ENDPOINTS.FILES_UPLOAD, formData, onProgress);
            }
            
            const response = await this.upload(CONFIG.API.ENDPOINTS.FILES_UPLOAD, formData);
            
            if (response.success) {
                return response.data;
            } else {
                throw new Error(response.error || CONFIG.ERRORS.FILE_UPLOAD_FAILED);
            }
        } catch (error) {
            console.error('文件上传失败:', error);
            throw error;
        }
    },
    
    // 带进度的文件上传
    uploadWithProgress(url, formData, onProgress) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    const percentComplete = (event.loaded / event.total) * 100;
                    onProgress(percentComplete);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        resolve(response);
                    } catch (e) {
                        reject(new Error('响应解析失败'));
                    }
                } else {
                    reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('网络错误'));
            });

            xhr.open('POST', url);

            // 添加认证头（必须在open之后设置）
            if (Auth && Auth.getToken()) {
                xhr.setRequestHeader('Authorization', `Bearer ${Auth.getToken()}`);
            }

            xhr.send(formData);
        });
    },
    
    // 下载文件
    async downloadFile(r2Key, fileName) {
        try {
            const url = `${CONFIG.API.ENDPOINTS.FILES_DOWNLOAD}/${r2Key}`;

            // 使用fetch获取文件，这样可以携带认证头
            const response = await this.request(url, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`下载失败: ${response.status} ${response.statusText}`);
            }

            // 获取文件blob
            const blob = await response.blob();

            // 创建下载链接
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = fileName;
            link.style.display = 'none';

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // 清理URL对象
            window.URL.revokeObjectURL(downloadUrl);

            return true;
        } catch (error) {
            console.error('文件下载失败:', error);

            // 下载失败通知已禁用，避免移动端弹窗遮挡输入框
            if (error.message.includes('401')) {
                console.error('下载失败：请重新登录');
                // 可以选择自动跳转到登录页
                if (typeof Auth !== 'undefined' && Auth.logout) {
                    setTimeout(() => {
                        Auth.logout();
                        window.location.href = '/login.html';
                    }, 2000);
                }
            } else {
                console.error(`下载失败：${error.message}`);
            }

            return false;
        }
    },

    // 检查认证状态
    async checkAuthStatus() {
        try {
            const response = await this.get('/auth/verify');
            return response.valid === true;
        } catch (error) {
            console.warn('认证状态检查失败:', error);
            return false;
        }
    },

    // 图片blob URL缓存
    imageBlobCache: new Map(),

    // 获取图片blob URL（用于预览）
    async getImageBlobUrl(r2Key) {
        // 检查缓存
        if (this.imageBlobCache.has(r2Key)) {
            return this.imageBlobCache.get(r2Key);
        }

        try {
            const url = `${CONFIG.API.ENDPOINTS.FILES_DOWNLOAD}/${r2Key}`;

            // 使用fetch获取图片，携带认证头
            const response = await this.request(url, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`获取图片失败: ${response.status}`);
            }

            // 获取图片blob
            const blob = await response.blob();

            // 创建blob URL
            const blobUrl = window.URL.createObjectURL(blob);

            // 缓存blob URL
            this.imageBlobCache.set(r2Key, blobUrl);

            return blobUrl;
        } catch (error) {
            console.error('获取图片blob URL失败:', error);
            throw error;
        }
    },

    // 清理图片blob URL缓存
    clearImageBlobCache() {
        for (const [key, blobUrl] of this.imageBlobCache) {
            window.URL.revokeObjectURL(blobUrl);
        }
        this.imageBlobCache.clear();
    },

    // 移除特定图片的blob URL
    revokeImageBlobUrl(r2Key) {
        if (this.imageBlobCache.has(r2Key)) {
            const blobUrl = this.imageBlobCache.get(r2Key);
            window.URL.revokeObjectURL(blobUrl);
            this.imageBlobCache.delete(r2Key);
        }
    },
    
    // 设备同步
    async syncDevice(deviceId, deviceName) {
        try {
            const response = await this.post(CONFIG.API.ENDPOINTS.SYNC, {
                deviceId,
                deviceName
            });

            if (response.success) {
                return true;
            } else {
                throw new Error(response.error || CONFIG.ERRORS.DEVICE_SYNC_FAILED);
            }
        } catch (error) {
            console.error('设备同步失败:', error);
            // 设备同步失败不应该阻止应用运行
            return false;
        }
    },

    // 清空所有数据
    async clearAllData(confirmCode) {
        try {
            const response = await this.post(CONFIG.API.ENDPOINTS.CLEAR_ALL, {
                confirmCode
            });

            if (response.success) {
                return response.data;
            } else {
                throw new Error(response.error || CONFIG.ERRORS.CLEAR_FAILED);
            }
        } catch (error) {
            console.error('数据清理失败:', error);
            throw new Error(error.message || CONFIG.ERRORS.CLEAR_FAILED);
        }
    }
};

// 冻结API对象
Object.freeze(API);
