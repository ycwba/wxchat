// PWA调试工具
// 用于快速诊断和修复PWA问题

class PWADebugger {
    constructor() {
        this.issues = [];
        this.fixes = [];
    }

    // 运行完整诊断
    async runDiagnosis() {
        console.log('🔍 开始PWA诊断...');
        
        this.issues = [];
        this.fixes = [];
        
        await this.checkManifest();
        await this.checkServiceWorker();
        await this.checkIcons();
        await this.checkInstallability();
        
        this.generateReport();
        return this.getResults();
    }

    // 检查Manifest
    async checkManifest() {
        console.log('📋 检查Manifest...');
        
        try {
            const response = await fetch('/manifest.json');
            if (!response.ok) {
                this.addIssue('Manifest文件无法访问', `HTTP ${response.status}`);
                return;
            }
            
            const manifest = await response.json();
            
            // 检查必需字段
            const requiredFields = ['name', 'short_name', 'start_url', 'display'];
            for (const field of requiredFields) {
                if (!manifest[field]) {
                    this.addIssue(`Manifest缺少字段: ${field}`, '添加必需字段');
                }
            }
            
            // 检查图标
            if (!manifest.icons || manifest.icons.length === 0) {
                this.addIssue('Manifest没有图标配置', '添加图标配置');
            } else {
                // 检查关键图标尺寸
                const sizes = manifest.icons.map(icon => icon.sizes);
                if (!sizes.includes('192x192')) {
                    this.addIssue('缺少192x192图标', '添加Android必需图标');
                }
                if (!sizes.includes('512x512')) {
                    this.addIssue('缺少512x512图标', '添加PWA必需图标');
                }
            }
            
            console.log('✅ Manifest检查完成');
            
        } catch (error) {
            this.addIssue('Manifest检查失败', error.message);
        }
    }

    // 检查Service Worker
    async checkServiceWorker() {
        console.log('⚙️ 检查Service Worker...');
        
        if (!('serviceWorker' in navigator)) {
            this.addIssue('浏览器不支持Service Worker', '使用现代浏览器');
            return;
        }
        
        try {
            const registration = await navigator.serviceWorker.getRegistration();
            
            if (!registration) {
                this.addIssue('Service Worker未注册', '检查注册代码');
                return;
            }
            
            if (!registration.active) {
                this.addIssue('Service Worker未激活', '等待激活或重新注册');
            }
            
            // 检查缓存
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                if (cacheNames.length === 0) {
                    this.addIssue('没有缓存数据', '等待Service Worker缓存资源');
                } else {
                    console.log(`✅ 发现 ${cacheNames.length} 个缓存`);
                }
            }
            
            console.log('✅ Service Worker检查完成');
            
        } catch (error) {
            this.addIssue('Service Worker检查失败', error.message);
        }
    }

    // 检查图标
    async checkIcons() {
        console.log('🎨 检查图标...');
        
        try {
            const response = await fetch('/manifest.json');
            const manifest = await response.json();
            
            if (!manifest.icons) {
                this.addIssue('Manifest中没有图标配置', '添加图标配置');
                return;
            }
            
            let successCount = 0;
            let totalCount = manifest.icons.length;
            
            // 检查前10个图标（避免太多请求）
            const iconsToCheck = manifest.icons.slice(0, 10);
            
            for (const icon of iconsToCheck) {
                try {
                    const iconResponse = await fetch(icon.src);
                    if (iconResponse.ok) {
                        successCount++;
                    } else {
                        this.addIssue(`图标加载失败: ${icon.src}`, `检查文件是否存在 (HTTP ${iconResponse.status})`);
                    }
                } catch (error) {
                    this.addIssue(`图标请求失败: ${icon.src}`, error.message);
                }
            }
            
            console.log(`✅ 图标检查完成: ${successCount}/${iconsToCheck.length} 成功`);
            
        } catch (error) {
            this.addIssue('图标检查失败', error.message);
        }
    }

    // 检查安装能力
    async checkInstallability() {
        console.log('📱 检查安装能力...');
        
        // 检查基本条件
        const conditions = {
            'HTTPS': location.protocol === 'https:' || location.hostname === 'localhost',
            'Service Worker': 'serviceWorker' in navigator,
            'Manifest': true // 已在上面检查
        };
        
        for (const [condition, passed] of Object.entries(conditions)) {
            if (!passed) {
                this.addIssue(`PWA安装条件不满足: ${condition}`, '满足PWA基本要求');
            }
        }
        
        // 检查安装状态
        const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
        if (isInstalled) {
            console.log('✅ 应用已安装（独立模式）');
        } else {
            console.log('ℹ️ 应用未安装（浏览器模式）');
        }
        
        // 检查安装提示
        if (window.deferredPrompt) {
            console.log('✅ 安装提示可用');
        } else {
            console.log('ℹ️ 安装提示不可用（可能已安装或条件未满足）');
        }
        
        console.log('✅ 安装能力检查完成');
    }

    // 添加问题
    addIssue(problem, solution) {
        this.issues.push({ problem, solution });
        console.warn(`⚠️ ${problem}: ${solution}`);
    }

    // 添加修复建议
    addFix(description, action) {
        this.fixes.push({ description, action });
    }

    // 生成报告
    generateReport() {
        console.log('\n📊 PWA诊断报告');
        console.log('='.repeat(50));
        
        if (this.issues.length === 0) {
            console.log('🎉 没有发现问题！PWA配置正常');
        } else {
            console.log(`\n❌ 发现 ${this.issues.length} 个问题:`);
            this.issues.forEach((issue, index) => {
                console.log(`${index + 1}. ${issue.problem}`);
                console.log(`   解决方案: ${issue.solution}`);
            });
        }
        
        // 提供快速修复建议
        if (this.issues.length > 0) {
            console.log('\n🔧 快速修复建议:');
            console.log('1. 检查所有图标文件是否存在');
            console.log('2. 确保使用HTTPS访问');
            console.log('3. 清理浏览器缓存后重试');
            console.log('4. 检查控制台错误信息');
        }
    }

    // 获取结果
    getResults() {
        return {
            issues: this.issues,
            fixes: this.fixes,
            hasIssues: this.issues.length > 0,
            summary: this.issues.length === 0 ? 'PWA配置正常' : `发现${this.issues.length}个问题`
        };
    }

    // 快速修复常见问题
    async quickFix() {
        console.log('🔧 尝试快速修复...');
        
        // 清理缓存
        if ('caches' in window) {
            try {
                const cacheNames = await caches.keys();
                for (const cacheName of cacheNames) {
                    await caches.delete(cacheName);
                }
                console.log('✅ 缓存已清理');
            } catch (error) {
                console.error('❌ 缓存清理失败:', error);
            }
        }
        
        // 重新注册Service Worker
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('✅ Service Worker重新注册成功');
            } catch (error) {
                console.error('❌ Service Worker注册失败:', error);
            }
        }
        
        console.log('🔧 快速修复完成，请刷新页面');
    }

    // 检查特定URL的资源
    async checkResource(url) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                console.log(`✅ 资源可访问: ${url}`);
                return true;
            } else {
                console.error(`❌ 资源访问失败: ${url} (HTTP ${response.status})`);
                return false;
            }
        } catch (error) {
            console.error(`❌ 资源请求失败: ${url}`, error.message);
            return false;
        }
    }
}

// 创建全局调试实例
window.PWADebugger = new PWADebugger();

// 提供便捷的调试命令
window.debugPWA = () => window.PWADebugger.runDiagnosis();
window.fixPWA = () => window.PWADebugger.quickFix();
window.checkResource = (url) => window.PWADebugger.checkResource(url);

console.log('🔧 PWA调试工具已加载');
console.log('使用 debugPWA() 运行诊断');
console.log('使用 fixPWA() 尝试快速修复');
console.log('使用 checkResource(url) 检查特定资源');
