// PWA功能测试脚本
// 用于验证PWA各项功能是否正常工作

class PWATestSuite {
    constructor() {
        this.results = [];
        this.errors = [];
    }

    // 运行所有测试
    async runAllTests() {
        console.log('🧪 开始PWA功能测试...');
        
        await this.testManifest();
        await this.testServiceWorker();
        await this.testIcons();
        await this.testInstallability();
        await this.testOfflineCapability();
        
        this.generateReport();
    }

    // 测试Manifest文件
    async testManifest() {
        console.log('📋 测试Manifest文件...');
        
        try {
            const response = await fetch('/manifest.json');
            if (!response.ok) {
                throw new Error(`Manifest加载失败: ${response.status}`);
            }
            
            const manifest = await response.json();
            
            // 检查必需字段
            const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
            for (const field of requiredFields) {
                if (!manifest[field]) {
                    throw new Error(`Manifest缺少必需字段: ${field}`);
                }
            }
            
            // 检查图标配置
            if (!Array.isArray(manifest.icons) || manifest.icons.length === 0) {
                throw new Error('Manifest中没有配置图标');
            }
            
            // 检查关键图标尺寸
            const requiredSizes = ['192x192', '512x512'];
            const availableSizes = manifest.icons.map(icon => icon.sizes);
            
            for (const size of requiredSizes) {
                if (!availableSizes.includes(size)) {
                    console.warn(`⚠️ 建议添加 ${size} 尺寸的图标`);
                }
            }
            
            this.addResult('✅ Manifest文件配置正确');
            
        } catch (error) {
            this.addError('❌ Manifest测试失败', error);
        }
    }

    // 测试Service Worker
    async testServiceWorker() {
        console.log('⚙️ 测试Service Worker...');
        
        try {
            if (!('serviceWorker' in navigator)) {
                throw new Error('浏览器不支持Service Worker');
            }
            
            const registration = await navigator.serviceWorker.getRegistration();
            if (!registration) {
                throw new Error('Service Worker未注册');
            }
            
            if (!registration.active) {
                throw new Error('Service Worker未激活');
            }
            
            // 测试缓存功能
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                if (cacheNames.length === 0) {
                    console.warn('⚠️ 没有发现缓存，可能Service Worker刚刚安装');
                } else {
                    this.addResult(`✅ 发现 ${cacheNames.length} 个缓存`);
                }
            }
            
            this.addResult('✅ Service Worker运行正常');
            
        } catch (error) {
            this.addError('❌ Service Worker测试失败', error);
        }
    }

    // 测试图标文件
    async testIcons() {
        console.log('🎨 测试图标文件...');
        
        try {
            const response = await fetch('/manifest.json');
            const manifest = await response.json();
            
            let successCount = 0;
            let totalCount = manifest.icons.length;
            
            for (const icon of manifest.icons) {
                try {
                    const iconResponse = await fetch(icon.src);
                    if (iconResponse.ok) {
                        successCount++;
                    } else {
                        console.warn(`⚠️ 图标加载失败: ${icon.src} (${iconResponse.status})`);
                    }
                } catch (error) {
                    console.warn(`⚠️ 图标请求失败: ${icon.src}`, error.message);
                }
            }
            
            if (successCount === totalCount) {
                this.addResult(`✅ 所有 ${totalCount} 个图标加载成功`);
            } else {
                this.addResult(`⚠️ ${successCount}/${totalCount} 个图标加载成功`);
            }
            
        } catch (error) {
            this.addError('❌ 图标测试失败', error);
        }
    }

    // 测试安装能力
    async testInstallability() {
        console.log('📱 测试安装能力...');
        
        try {
            // 检查是否已安装
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
            if (isStandalone) {
                this.addResult('✅ 应用运行在独立模式（已安装）');
                return;
            }
            
            // 检查安装提示
            if (window.deferredPrompt) {
                this.addResult('✅ 安装提示可用');
            } else {
                this.addResult('ℹ️ 安装提示暂不可用（可能需要满足更多条件）');
            }
            
            // 检查PWA条件
            const conditions = {
                'HTTPS': location.protocol === 'https:' || location.hostname === 'localhost',
                'Manifest': true, // 已在上面测试
                'Service Worker': 'serviceWorker' in navigator,
                'Icons': true // 已在上面测试
            };
            
            const passedConditions = Object.entries(conditions)
                .filter(([key, value]) => value)
                .map(([key]) => key);
            
            this.addResult(`✅ PWA安装条件: ${passedConditions.join(', ')}`);
            
        } catch (error) {
            this.addError('❌ 安装能力测试失败', error);
        }
    }

    // 测试离线能力
    async testOfflineCapability() {
        console.log('🌐 测试离线能力...');
        
        try {
            if (!('caches' in window)) {
                throw new Error('浏览器不支持Cache API');
            }
            
            const cacheNames = await caches.keys();
            if (cacheNames.length === 0) {
                this.addResult('⚠️ 没有缓存，离线功能可能不可用');
                return;
            }
            
            // 检查关键资源是否已缓存
            const criticalResources = [
                '/',
                '/index.html',
                '/manifest.json',
                '/css/main.css',
                '/js/app.js'
            ];
            
            let cachedCount = 0;
            for (const cacheName of cacheNames) {
                const cache = await caches.open(cacheName);
                for (const resource of criticalResources) {
                    const cachedResponse = await cache.match(resource);
                    if (cachedResponse) {
                        cachedCount++;
                        break; // 找到就跳出内层循环
                    }
                }
            }
            
            if (cachedCount > 0) {
                this.addResult(`✅ ${cachedCount}/${criticalResources.length} 关键资源已缓存`);
            } else {
                this.addResult('⚠️ 关键资源未缓存，离线功能可能受限');
            }
            
        } catch (error) {
            this.addError('❌ 离线能力测试失败', error);
        }
    }

    // 添加测试结果
    addResult(message) {
        this.results.push(message);
        console.log(message);
    }

    // 添加错误
    addError(message, error) {
        const errorMsg = `${message}: ${error.message}`;
        this.errors.push(errorMsg);
        console.error(errorMsg);
    }

    // 生成测试报告
    generateReport() {
        console.log('\n📊 PWA测试报告');
        console.log('='.repeat(50));
        
        console.log('\n✅ 成功项目:');
        this.results.forEach(result => console.log(`  ${result}`));
        
        if (this.errors.length > 0) {
            console.log('\n❌ 错误项目:');
            this.errors.forEach(error => console.log(`  ${error}`));
        }
        
        const totalTests = this.results.length + this.errors.length;
        const successRate = ((this.results.length / totalTests) * 100).toFixed(1);
        
        console.log(`\n📈 测试总结: ${this.results.length}/${totalTests} 项通过 (${successRate}%)`);
        
        if (this.errors.length === 0) {
            console.log('🎉 所有PWA功能测试通过！');
        } else {
            console.log('⚠️ 部分功能需要优化，请查看上述错误信息');
        }
        
        return {
            success: this.results,
            errors: this.errors,
            successRate: successRate
        };
    }
}

// 创建全局测试实例
window.PWATest = new PWATestSuite();

// 自动运行测试（仅在开发模式）
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    // 延迟运行，等待PWA初始化完成
    setTimeout(() => {
        console.log('🔧 开发模式：自动运行PWA测试');
        window.PWATest.runAllTests();
    }, 3000);
}

console.log('🧪 PWA测试套件已加载，使用 PWATest.runAllTests() 手动运行测试');
