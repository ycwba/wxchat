/**
 * 相机拍照组件
 * 支持移动设备相机访问、前后摄像头切换、拍照功能
 */
const CameraCapture = {
    // 组件状态
    isInitialized: false,
    isOpen: false,
    currentStream: null,
    currentFacingMode: 'environment', // 'user' 前置, 'environment' 后置
    
    // DOM 元素
    elements: {
        modal: null,
        video: null,
        canvas: null,
        captureBtn: null,
        switchBtn: null,
        closeBtn: null
    },

    // 初始化组件
    init() {
        if (this.isInitialized) return;
        
        this.createCameraModal();
        this.bindEvents();
        this.isInitialized = true;
        
        console.log('CameraCapture: 组件初始化完成');
    },

    // 创建相机模态框
    createCameraModal() {
        const modal = document.createElement('div');
        modal.id = 'cameraModal';
        modal.className = 'camera-modal';
        modal.innerHTML = `
            <div class="camera-container">
                <div class="camera-header">
                    <button class="camera-close-btn" id="cameraCloseBtn">
                        <span>✕</span>
                    </button>
                    <h3>拍照</h3>
                    <button class="camera-switch-btn" id="cameraSwitchBtn">
                        <span>🔄</span>
                    </button>
                </div>
                
                <div class="camera-preview">
                    <video id="cameraVideo" autoplay playsinline muted></video>
                    <canvas id="cameraCanvas" style="display: none;"></canvas>
                </div>
                
                <div class="camera-controls">
                    <button class="camera-capture-btn" id="cameraCaptureBtn">
                        <div class="capture-circle">
                            <div class="capture-inner"></div>
                        </div>
                    </button>
                </div>
                
                <div class="camera-status" id="cameraStatus" style="display: none;">
                    <span>📸 正在处理照片...</span>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 缓存DOM元素
        this.elements.modal = modal;
        this.elements.video = document.getElementById('cameraVideo');
        this.elements.canvas = document.getElementById('cameraCanvas');
        this.elements.captureBtn = document.getElementById('cameraCaptureBtn');
        this.elements.switchBtn = document.getElementById('cameraSwitchBtn');
        this.elements.closeBtn = document.getElementById('cameraCloseBtn');
    },

    // 绑定事件
    bindEvents() {
        // 拍照按钮
        this.elements.captureBtn?.addEventListener('click', () => {
            this.capturePhoto();
        });

        // 切换摄像头按钮
        this.elements.switchBtn?.addEventListener('click', () => {
            this.switchCamera();
        });

        // 关闭按钮
        this.elements.closeBtn?.addEventListener('click', () => {
            this.closeCamera();
        });

        // 点击模态框背景关闭
        this.elements.modal?.addEventListener('click', (e) => {
            if (e.target === this.elements.modal) {
                this.closeCamera();
            }
        });

        // 阻止视频区域的点击事件冒泡
        this.elements.video?.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    },

    // 打开相机
    async openCamera() {
        try {
            if (!this.isInitialized) {
                this.init();
            }

            // 显示模态框
            this.elements.modal.classList.add('show');
            this.isOpen = true;

            // 请求相机权限并开始预览
            await this.startCamera();
            
        } catch (error) {
            console.error('CameraCapture: 打开相机失败:', error);
            this.handleCameraError(error);
        }
    },

    // 启动相机
    async startCamera() {
        try {
            // 停止当前流
            this.stopCurrentStream();

            // 请求相机权限
            const constraints = {
                video: {
                    facingMode: this.currentFacingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            };

            this.currentStream = await navigator.mediaDevices.getUserMedia(constraints);
            this.elements.video.srcObject = this.currentStream;

            // 等待视频加载
            await new Promise((resolve) => {
                this.elements.video.onloadedmetadata = resolve;
            });

            console.log('CameraCapture: 相机启动成功');
            
        } catch (error) {
            console.error('CameraCapture: 启动相机失败:', error);
            throw error;
        }
    },

    // 切换摄像头
    async switchCamera() {
        try {
            // 切换前后摄像头
            this.currentFacingMode = this.currentFacingMode === 'user' ? 'environment' : 'user';

            // 更新预览区域的CSS类
            const preview = document.querySelector('.camera-preview');
            if (preview) {
                if (this.currentFacingMode === 'environment') {
                    preview.classList.add('rear-camera');
                } else {
                    preview.classList.remove('rear-camera');
                }
            }

            // 重新启动相机
            await this.startCamera();

            // 显示切换提示
            const facing = this.currentFacingMode === 'user' ? '前置' : '后置';
            UI.showSuccess(`已切换到${facing}摄像头`);

        } catch (error) {
            console.error('CameraCapture: 切换摄像头失败:', error);

            // 切换失败，恢复原来的设置
            this.currentFacingMode = this.currentFacingMode === 'user' ? 'environment' : 'user';

            // 恢复CSS类
            const preview = document.querySelector('.camera-preview');
            if (preview) {
                if (this.currentFacingMode === 'environment') {
                    preview.classList.add('rear-camera');
                } else {
                    preview.classList.remove('rear-camera');
                }
            }

            UI.showError('切换摄像头失败，可能设备不支持');
        }
    },

    // 拍照
    async capturePhoto() {
        try {
            if (!this.currentStream || !this.elements.video.videoWidth) {
                throw new Error('相机未准备就绪');
            }

            // 显示拍照闪光效果
            this.showCameraFlash();

            // 显示处理状态
            this.showProcessingStatus(true);

            // 设置canvas尺寸
            const video = this.elements.video;
            const canvas = this.elements.canvas;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // 绘制当前帧到canvas
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // 转换为Blob
            const blob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/jpeg', 0.8);
            });

            if (!blob) {
                throw new Error('生成图片失败');
            }

            // 创建文件对象
            const timestamp = Date.now();
            const fileName = `photo-${timestamp}.jpg`;
            const file = new File([blob], fileName, {
                type: 'image/jpeg',
                lastModified: timestamp
            });

            // 上传文件
            await this.uploadPhoto(file);

            // 关闭相机
            this.closeCamera();

            // 显示成功提示
            UI.showSuccess('📸 照片拍摄成功！');

        } catch (error) {
            console.error('CameraCapture: 拍照失败:', error);
            this.showProcessingStatus(false);
            UI.showError(`拍照失败: ${error.message}`);
        }
    },

    // 上传照片
    async uploadPhoto(file) {
        try {
            const deviceId = Utils.getDeviceId();
            const uploadResult = await API.uploadFile(file, deviceId);
            
            // 刷新消息列表显示新照片
            setTimeout(async () => {
                await MessageHandler.loadMessages(true);
            }, 500);

            return uploadResult;
            
        } catch (error) {
            console.error('CameraCapture: 上传照片失败:', error);
            throw new Error('照片上传失败');
        }
    },

    // 显示拍照闪光效果
    showCameraFlash() {
        const flash = document.createElement('div');
        flash.className = 'camera-flash';
        this.elements.modal.appendChild(flash);

        // 动画结束后移除元素
        setTimeout(() => {
            if (flash.parentNode) {
                flash.parentNode.removeChild(flash);
            }
        }, 300);
    },

    // 显示/隐藏处理状态
    showProcessingStatus(show) {
        const statusElement = document.getElementById('cameraStatus');
        if (statusElement) {
            statusElement.style.display = show ? 'flex' : 'none';
        }
    },

    // 关闭相机
    closeCamera() {
        try {
            // 停止视频流
            this.stopCurrentStream();

            // 隐藏模态框
            if (this.elements.modal) {
                this.elements.modal.classList.remove('show');
            }

            this.isOpen = false;
            console.log('CameraCapture: 相机已关闭');
            
        } catch (error) {
            console.error('CameraCapture: 关闭相机失败:', error);
        }
    },

    // 停止当前视频流
    stopCurrentStream() {
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => {
                track.stop();
            });
            this.currentStream = null;
        }

        if (this.elements.video) {
            this.elements.video.srcObject = null;
        }
    },

    // 处理相机错误
    handleCameraError(error) {
        let errorMessage = '相机访问失败';
        
        if (error.name === 'NotAllowedError') {
            errorMessage = '相机权限被拒绝，请在浏览器设置中允许相机访问';
        } else if (error.name === 'NotFoundError') {
            errorMessage = '未找到可用的相机设备';
        } else if (error.name === 'NotSupportedError') {
            errorMessage = '您的设备不支持相机功能';
        } else if (error.name === 'NotReadableError') {
            errorMessage = '相机被其他应用占用，请关闭其他相机应用后重试';
        }

        UI.showError(errorMessage);
        this.closeCamera();
    }
};

// 导出组件
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CameraCapture;
}
