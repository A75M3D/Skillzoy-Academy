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

// ========== Service Worker Registration ==========
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('✅ Service Worker registered with scope:', registration.scope);
                
                // استمع لرسائل التحديث من service worker
                navigator.serviceWorker.addEventListener('message', (event) => {
                    if (event.data && event.data.type === 'SW_UPDATED') {
                        showUpdateNotification();
                    }
                });

                // تحقق إذا فيه تحديث جديد
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('🔄 New Service Worker found!');
                    
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('📦 New content available - activating new version!');
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

    // التحقق من التحديثات عند التركيز على الصفحة
    window.addEventListener('focus', () => {
        navigator.serviceWorker.ready.then((registration) => {
            registration.update();
        });
    });
}

// ========== إشعار التحديث ==========
function showUpdateNotification() {
    // منع التكرار إذا كان الإشعار موجود بالفعل
    if (document.getElementById('update-notification')) return;

    const notification = document.createElement('div');
    notification.id = 'update-notification';
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
        animation: slideInRight 0.3s ease-out;
    `;
    
    notification.innerHTML = safeHTML(`
        <div style="margin-bottom: 10px; font-weight: bold;">
            🔄 تحديث جديد متاح!
        </div>
        <p style="margin: 0 0 10px 0; font-size: 14px;">يوجد إصدار جديد من التطبيق</p>
        <button id="reload-btn" style="
            background: white;
            color: #1e3a8a;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            margin-right: 8px;
        ">تحديث الآن</button>
        <button id="close-update-btn" style="
            background: transparent;
            color: white;
            border: 1px solid white;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
        ">لاحقاً</button>
    `);
    
    document.body.appendChild(notification);
    
    // حدث زر التحديث
    document.getElementById('reload-btn').addEventListener('click', () => {
        window.location.reload();
    });

    // حدث زر الإغلاق
    document.getElementById('close-update-btn').addEventListener('click', () => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    });

    // إزالة الإشعار تلقائيًا بعد 15 ثوانٍ
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 15000);
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

// إضافة أنميشن CSS مطلوب
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// جعل الدوال متاحة عالميًا
window.safeHTML = safeHTML;
window.displaySafeText = displaySafeText;
window.AppState = AppState;
window.Utils = Utils;
window.showUpdateNotification = showUpdateNotification;
