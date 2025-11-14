// ========== نظام الأمان المتوازن - بدون تعارض ==========
class BalancedSecuritySystem {
    constructor() {
        this.csrfToken = this.generateCSRFToken();
        this.init();
    }

    init() {
        console.log('🛡️ نظام الأمان المتوازن مفعل - بدون تعارض');
        this.setupSmartCSRF();
        this.setupNonIntrusiveProtection();
        this.setupSmartMonitoring();
    }

    // ========== 1. حماية CSRF ذكية (بدون تعطيل الخدمات) ==========
    setupSmartCSRF() {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            // إضافة CSRF فقط للطلبات التي تحتاجه حقاً
            if (this.requiresCSRF(args)) {
                args[1] = args[1] || {};
                args[1].headers = {
                    ...args[1].headers,
                    'X-CSRF-Token': this.csrfToken
                };
            }
            return originalFetch.apply(this, args);
        };
    }

    requiresCSRF(args) {
        // فقط الطلبات التي تغير البيانات وتوجه لموقعنا
        const url = args[0];
        const method = args[1]?.method?.toUpperCase();
        
        const isOurDomain = typeof url === 'string' && url.includes(window.location.hostname);
        const isModifyingMethod = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
        
        return isOurDomain && isModifyingMethod;
    }

    generateCSRFToken() {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    // ========== 2. حماية غير متطفلة ==========
    setupNonIntrusiveProtection() {
        // ✅ لا تمنع أدوات المطور
        // ✅ لا تمنع النسخ العادي
        // ✅ لا تمنع النوافذ المنبثقة الشرعية
        
        this.setupSelectiveContextMenu();
        this.setupCopyProtection();
        this.setupFormProtection();
    }

    setupSelectiveContextMenu() {
        document.addEventListener('contextmenu', (e) => {
            // فقط على العناصر التي تحمل class "protected"
            if (e.target.classList.contains('protected') || 
                e.target.closest('.protected')) {
                e.preventDefault();
                this.showToast('❌ هذا الإجراء غير مسموح هنا', 'warning', 2000);
            }
        });
    }

    setupCopyProtection() {
        document.addEventListener('copy', (e) => {
            // فقط على العناصر التي تحمل class "no-copy"
            if (e.target.classList.contains('no-copy') || 
                e.target.closest('.no-copy')) {
                e.preventDefault();
                this.showToast('❌ النسخ غير مسموح من هذا المحتوى', 'warning', 2000);
            }
        });
    }

    setupFormProtection() {
        // حماية النماذج من البوتات بدون التأثير على المستخدمين
        document.addEventListener('submit', (e) => {
            const form = e.target;
            
            // فحص الوقت - إذا تم تعبئة النموذج بسرعة كبيرة
            const startTime = parseInt(form.dataset.startTime || Date.now());
            const fillTime = Date.now() - startTime;
            
            if (fillTime < 1000) { // أقل من ثانية
                this.logSuspiciousActivity('FAST_FORM_SUBMISSION', { fillTime });
                // لا نمنع، فقط نسجل
            }
        });

        // تسجيل وقت بدء التعامل مع النموذج
        document.addEventListener('focus', (e) => {
            if (e.target.form && !e.target.form.dataset.startTime) {
                e.target.form.dataset.startTime = Date.now();
            }
        }, true);
    }

    // ========== 3. مراقبة ذكية (بدون حظر) ==========
    setupSmartMonitoring() {
        this.setupActivityLogging();
        this.setupErrorMonitoring();
    }

    setupActivityLogging() {
        // تسجيل الأنشطة المشبوهة بدون حظر المستخدم
        window.addEventListener('error', (e) => {
            this.logSuspiciousActivity('CLIENT_ERROR', {
                message: e.message,
                filename: e.filename,
                lineno: e.lineno
            });
        });
    }

    setupErrorMonitoring() {
        // مراقبة الأخطاء بدون التأثير على الأداء
        const originalConsoleError = console.error;
        console.error = (...args) => {
            this.logSuspiciousActivity('CONSOLE_ERROR', { args: args.map(String) });
            originalConsoleError.apply(console, args);
        };
    }

    // ========== 4. دوال الأمان الأساسية (آمنة) ==========
    safeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    sanitizeInput(input) {
        if (!input) return '';
        return input.trim().replace(/[<>"'&\\\/]/g, '');
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validatePassword(password) {
        return password && password.length >= 6;
    }

    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // ========== 5. أدوات مساعدة (بدون تعقيد) ==========
    showToast(message, type = 'info', duration = 3000) {
        // منع التكرار
        const existingToast = document.getElementById('security-toast');
        if (existingToast) {
            document.body.removeChild(existingToast);
        }

        const toast = document.createElement('div');
        toast.id = 'security-toast';
        const styles = {
            info: 'background: #3b82f6;',
            success: 'background: #10b981;',
            warning: 'background: #f59e0b;',
            error: 'background: #ef4444;'
        };
        
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            border-radius: 6px;
            color: white;
            z-index: 10000;
            font-weight: bold;
            font-family: Arial, sans-serif;
            ${styles[type]}
            animation: toastSlideIn 0.3s ease-out;
        `;
        
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (document.body.contains(toast)) {
                toast.style.animation = 'toastSlideOut 0.3s ease-in';
                setTimeout(() => {
                    if (document.body.contains(toast)) {
                        document.body.removeChild(toast);
                    }
                }, 300);
            }
        }, duration);
    }

    logSuspiciousActivity(type, data = {}) {
        const activity = {
            type,
            data,
            timestamp: new Date().toISOString(),
            url: window.location.href
        };
        
        // تخزين محلي فقط - بدون إرسال للسيرفر (لتجنب مشاكل CORS)
        this.storeLocally(activity);
        
        console.log(`🔍 نشاط مسجل: ${type}`, activity);
    }

    storeLocally(activity) {
        try {
            const stored = JSON.parse(localStorage.getItem('security_logs') || '[]');
            stored.push(activity);
            // حفظ آخر 50 حدث فقط
            localStorage.setItem('security_logs', JSON.stringify(stored.slice(-50)));
        } catch (e) {
            // إذا فشل التخزين، لا نفعل شيء (لتجنب الأخطاء)
        }
    }

    // ========== 6. التنظيف الآمن ==========
    cleanup() {
        // تنظيف ذكي - إزالة فقط ما أنشأناه
        const toast = document.getElementById('security-toast');
        if (toast) {
            document.body.removeChild(toast);
        }
    }
}

// ========== التهيئة الآمنة ==========
let Security;

document.addEventListener('DOMContentLoaded', function() {
    try {
        Security = new BalancedSecuritySystem();
        
        // إضافة CSS للأنيميشن
        const style = document.createElement('style');
        style.textContent = `
            @keyframes toastSlideIn {
                from {
                    transform: translateX(-50%) translateY(-100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(-50%) translateY(0);
                    opacity: 1;
                }
            }
            
            @keyframes toastSlideOut {
                from {
                    transform: translateX(-50%) translateY(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(-50%) translateY(-100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
        
        console.log('✅ نظام الأمان شغال بدون تعارض');
    } catch (error) {
        console.warn('⚠️ نظام الأمان لم يتم تحميله، لكن الموقع سيستمر في العمل:', error);
    }
});

// ========== جعل الدوال متاحة بشكل آمن ==========
// نستخدم try/catch لتجنب أي أخطاء
try {
    window.safeHTML = (str) => {
        return Security ? Security.safeHTML(str) : (str || '');
    };
    
    window.sanitizeInput = (input) => {
        return Security ? Security.sanitizeInput(input) : (input || '');
    };
    
    window.validateEmail = (email) => {
        return Security ? Security.validateEmail(email) : false;
    };
    
    window.validatePassword = (password) => {
        return Security ? Security.validatePassword(password) : false;
    };
} catch (error) {
    console.log('🔧 الدوال الأمنية غير متاحة، لكن الموقع يعمل بشكل طبيعي');
}

// ========== التأكد من أن الموقع يعمل حتى إذا فشل الأمان ==========
window.addEventListener('error', (e) => {
    // منع انتشار الأخطاء الحرجة
    if (e.message && e.message.includes('Security')) {
        console.log('🛡️ خطأ في نظام الأمان تم احتواؤه');
        e.preventDefault();
    }
});
