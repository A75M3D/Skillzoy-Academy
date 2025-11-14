// ========== الأمان والحماية ==========
function safeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function displaySafeText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
    }
}
// ===== نظام الأمان الشامل =====
class SecuritySystem {
    constructor() {
        this.devToolsOpen = false;
        this.lastTime = Date.now();
        this.csrfToken = this.generateCSRFToken();
        this.encryptionKey = 'skillzoy-secure-key-2024';
        
        this.init();
    }

    init() {
        this.detectDevTools();
        this.preventContextMenu();
        this.preventCopy();
        this.preventNewWindows();
        this.setupCSRFProtection();
        this.hideSensitiveData();
        this.setupCSP();
        this.integrityCheck();
    }

    // توليد رمز CSRF
    generateCSRFToken() {
        const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
        localStorage.setItem('csrf_token', token);
        return token;
    }

    // اكتشاف أدوات المطور
    detectDevTools() {
        // الطريقة 1: قياس الوقت
        setInterval(() => {
            const currentTime = Date.now();
            if (currentTime - this.lastTime > 200) {
                this.devToolsOpen = true;
                this.handleDevToolsDetection();
            }
            this.lastTime = currentTime;
        }, 1000);

        // الطريقة 2: مراقبة حجم النافذة
        const widthThreshold = window.outerWidth - window.innerWidth > 160;
        const heightThreshold = window.outerHeight - window.innerHeight > 160;
        
        if (widthThreshold || heightThreshold) {
            this.devToolsOpen = true;
            this.handleDevToolsDetection();
        }

        // الطريقة 3: اكتشاف عناصر أدوات المطور
        const checkForDevTools = () => {
            const elements = document.querySelectorAll('*');
            for (let el of elements) {
                if (el.tagName.includes('-') || 
                    el.className.includes('devtools') || 
                    el.id.includes('devtools')) {
                    this.devToolsOpen = true;
                    this.handleDevToolsDetection();
                    break;
                }
            }
        };
        setInterval(checkForDevTools, 3000);
    }

    handleDevToolsDetection() {
        // إجراءات عند اكتشاف أدوات المطور
        document.body.innerHTML = '<div style="text-align:center; padding:50px; font-family: Arial; color:red;"><h1>🚫 Access Denied</h1><p>Developer tools are not allowed on this page.</p></div>';
        window.location.href = 'about:blank';
        throw new Error('Developer tools detection');
    }

    // منع القائمة المنبثقة (النقر بزر الماوس الأيمن)
    preventContextMenu() {
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            return false;
        });
    }

    // منع النسخ
    preventCopy() {
        document.addEventListener('copy', (e) => {
            e.preventDefault();
            return false;
        });

        document.addEventListener('cut', (e) => {
            e.preventDefault();
            return false;
        });
    }

    // منع فتح النوافذ المنبثقة
    preventNewWindows() {
        window.open = function() { return null; };
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && (e.key === 'u' || e.key === 'U' || e.key === 's' || e.key === 'S')) {
                e.preventDefault();
                return false;
            }
        });
    }

    // إعداد حماية CSRF
    setupCSRFProtection() {
        // إضافة رمز CSRF لجميع طلبات AJAX
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            if (args[1]) {
                args[1].headers = {
                    ...args[1].headers,
                    'X-CSRF-Token': localStorage.getItem('csrf_token')
                };
            }
            return originalFetch.apply(this, args);
        };
    }

    // إخفاء البيانات الحساسة
    hideSensitiveData() {
        // إزالة البيانات الحساسة من الكود المصدري
        delete window.SUPABASE_URL;
        delete window.SUPABASE_ANON_KEY;
        delete window.YOUTUBE_API_KEY;
        
        // تشفير البيانات في localStorage
        this.encryptLocalStorage();
    }

    // تشفير البيانات في localStorage
    encryptLocalStorage() {
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = function(key, value) {
            if (key.includes('user') || key.includes('token') || key.includes('certificate')) {
                value = btoa(unescape(encodeURIComponent(value)));
            }
            originalSetItem.call(this, key, value);
        };

        const originalGetItem = localStorage.getItem;
        localStorage.getItem = function(key) {
            let value = originalGetItem.call(this, key);
            if (value && (key.includes('user') || key.includes('token') || key.includes('certificate'))) {
                try {
                    value = decodeURIComponent(escape(atob(value)));
                } catch (e) {
                    // إذا فشل فك التشفير، نعيد القيمة كما هي
                }
            }
            retur
// ========== Service Worker Registration ==========
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/service-worker.js')
            .then(function(registration) {
                console.log('✅ Service Worker registered with scope:', registration.scope);
                
                // تحقق إذا فيه تحديث جديد
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('🔄 New Service Worker found!');
                    
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('📦 New content available - activating new version!');
                            
                            // ✅ تفعيل النسخة الجديدة فورًا
                            newWorker.postMessage({ type: 'SKIP_WAITING' });

                            // عرض إشعار التحديث
                            showUpdateNotification();
                        }
                    });
                });
            })
            .catch(function(error) {
                console.log('❌ Service Worker registration failed:', error);
            });
    });

    // تحديث الصفحة تلقائيًا عندما يصبح الـ Service Worker الجديد جاهز
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
            refreshing = true;
            console.log('🔄 Controller changed - reloading page');
            showReloadMessage(); // عرض تنبيه قبل التحديث
            setTimeout(() => window.location.reload(), 1500); // تحديث بعد ثانية ونصف
        }
    });
}

// ========== إشعار التحديث ==========
function showUpdateNotification() {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #1e3a8a;
        color: white;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 300px;
        font-family: Arial, sans-serif;
        animation: fadeIn 0.4s ease;
    `;
    
    notification.innerHTML = safeHTML(`
        <div style="margin-bottom: 10px;">
            <strong>تحديث جديد متاح!</strong>
        </div>
        <button id="reload-btn" style="
            background: white;
            color: #1e3a8a;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
        ">تحديث الآن</button>
    `);
    
    document.body.appendChild(notification);
    
    document.getElementById('reload-btn').addEventListener('click', () => {
        window.location.reload();
    });

    // إزالة الإشعار تلقائيًا بعد 10 ثوانٍ
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 10000);
}

// ========== تنبيه أثناء التحديث ==========
function showReloadMessage() {
    const message = document.createElement('div');
    message.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #111827;
        color: white;
        padding: 20px 30px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        font-family: 'Cairo', sans-serif;
        font-size: 16px;
        z-index: 99999;
        text-align: center;
    `;
    message.innerHTML = '⏳ جارٍ تحديث الموقع إلى آخر إصدار...';
    document.body.appendChild(message);
}

// ========== إدارة الحالة ==========
const AppState = {
    currentUser: null,
    isOnline: navigator.onLine,
    
    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
        console.log('🚀 Skillzoy Academy Initialized');
    },
    
    setupEventListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.showOnlineStatus();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showOfflineStatus();
        });

        document.addEventListener('contextmenu', (e) => {
            if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
            }
        });
    },
    
    checkAuthStatus() {
        const token = localStorage.getItem('authToken');
        if (token) {
            this.currentUser = this.validateToken(token);
        }
    },
    
    validateToken(token) {
        try {
            return JSON.parse(atob(token.split('.')[1]));
        } catch (error) {
            localStorage.removeItem('authToken');
            return null;
        }
    },
    
    showOnlineStatus() {
        this.showToast('✅ تم استعادة الاتصال بالإنترنت', 'success');
    },
    
    showOfflineStatus() {
        this.showToast('⚠️ أنت غير متصل بالإنترنت', 'warning');
    },
    
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        const styles = {
            info: 'background: #3b82f6; color: white;',
            success: 'background: #10b981; color: white;',
            warning: 'background: #f59e0b; color: white;',
            error: 'background: #ef4444; color: white;'
        };
        
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            border-radius: 6px;
            z-index: 9999;
            font-weight: bold;
            ${styles[type]}
        `;
        
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 3000);
    }
};

// ========== الأدوات المساعدة ==========
const Utils = {
    formatDate(date) {
        return new Date(date).toLocaleDateString('ar-EG');
    },
    
    sanitizeInput(input) {
        return input.trim().replace(/[<>]/g, '');
    },
    
    async loadPage(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network error');
            return await response.text();
        } catch (error) {
            console.error('❌ Error loading page:', error);
            return '<p>خطأ في تحميل الصفحة</p>';
        }
    },
    
    smoothScrollTo(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    }
};

// ========== تهيئة التطبيق ==========
document.addEventListener('DOMContentLoaded', function() {
    AppState.init();
    displaySafeText('app-title', 'Skillzoy Academy');
    displaySafeText('app-subtitle', 'منصة التعلم الذكي');
    
    if (!AppState.isOnline) {
        AppState.showOfflineStatus();
    }
    
    console.log('🎓 Skillzoy Academy is ready!');
});

// ========== التعامل مع الأخطاء ==========
window.addEventListener('error', function(e) {
    console.error('💥 Global error:', e.error);
    if (window.location.hostname !== 'localhost') {
        // fetch('/api/error', { method: 'POST', body: JSON.stringify({ error: e.error.toString() }) });
    }
});

// جعل الدوال متاحة عالميًا
window.safeHTML = safeHTML;
window.displaySafeText = displaySafeText;
window.AppState = AppState;
window.Utils = Utils;
