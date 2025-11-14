// ========== الأمان والحماية المتوازنة ==========
class SecuritySystem {
    constructor() {
        this.csrfToken = this.generateCSRFToken();
        this.init();
    }

    init() {
        this.setupCSRFProtection();
        this.setupBasicProtection();
        console.log('🛡️ نظام الأمان المفعل - Skillzoy Academy');
    }

    // توليد رمز CSRF آمن
    generateCSRFToken() {
        const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
        sessionStorage.setItem('csrf_token', token);
        return token;
    }

    // حماية أساسية متوازنة
    setupBasicProtection() {
        // منع context menu على العناصر الحساسة فقط (بدون تطرف)
        document.addEventListener('contextmenu', (e) => {
            if (e.target.classList.contains('no-context') || 
                e.target.closest('.no-context')) {
                e.preventDefault();
                this.showToast('❌ هذا الإجراء غير مسموح في هذا العنصر', 'warning');
            }
        });

        // منع النسخ من العناصر المحمية فقط
        document.addEventListener('copy', (e) => {
            if (e.target.classList.contains('no-copy') || 
                e.target.closest('.no-copy')) {
                e.preventDefault();
                this.showToast('❌ النسخ غير مسموح من هذا العنصر', 'warning');
            }
        });

        // حماية من فتح النوافذ المنبثقة الضارة فقط
        window.addEventListener('beforeunload', (e) => {
            // لا نمنع التنقل العادي، فقط نحمي من الإجراءات الضارة
        });
    }

    // حماية CSRF للطلبات الهامة
    setupCSRFProtection() {
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            if (args[1] && args[1].method && ['POST', 'PUT', 'DELETE'].includes(args[1].method.toUpperCase())) {
                args[1].headers = {
                    ...args[1].headers,
                    'X-CSRF-Token': sessionStorage.getItem('csrf_token')
                };
            }
            return originalFetch.apply(this, args);
        };
    }

    // دوال الأمان الأساسية
    safeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    displaySafeText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        }
    }

    sanitizeInput(input) {
        if (!input) return '';
        return input.trim().replace(/[<>"'&]/g, '');
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

    // تشفير بسيط للبيانات الحساسة
    encryptData(data) {
        if (!data) return '';
        try {
            return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
        } catch (e) {
            return data;
        }
    }

    decryptData(encryptedData) {
        if (!encryptedData) return '';
        try {
            return JSON.parse(decodeURIComponent(escape(atob(encryptedData))));
        } catch (e) {
            return encryptedData;
        }
    }

    // التحقق من سلامة البيانات
    validateFormData(formData) {
        const errors = [];
        
        if (formData.email && !this.validateEmail(formData.email)) {
            errors.push('البريد الإلكتروني غير صالح');
        }
        
        if (formData.password && !this.validatePassword(formData.password)) {
            errors.push('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // عرض إشعارات للمستخدم
    showToast(message, type = 'info') {
        // منع التكرار
        if (document.getElementById('security-toast')) return;

        const toast = document.createElement('div');
        toast.id = 'security-toast';
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
        }, 3000);
    }

    // تنظيف الذاكرة عند الخروج
    cleanup() {
        sessionStorage.removeItem('csrf_token');
        console.log('🧹 تم تنظيف بيانات الأمان');
    }
}

// ========== التهيئة التلقائية ==========
let AppSecurity;

document.addEventListener('DOMContentLoaded', function() {
    AppSecurity = new SecuritySystem();
    
    // إضافة أنميشن CSS مطلوب
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
        
        /* كلاسات للحماية الانتقائية */
        .no-context {
            user-select: none;
            -webkit-user-select: none;
        }
        
        .no-copy {
            user-select: none;
            -webkit-user-select: none;
        }
        
        .allow-context {
            user-select: text;
            -webkit-user-select: text;
        }
    `;
    document.head.appendChild(style);
    
    console.log('✅ نظام الأمان جاهز للاستخدام');
});

// ========== جعل الدوال متاحة عالمياً ==========
window.safeHTML = function(str) {
    return AppSecurity ? AppSecurity.safeHTML(str) : str;
};

window.displaySafeText = function(elementId, text) {
    if (AppSecurity) {
        AppSecurity.displaySafeText(elementId, text);
    }
};

window.sanitizeInput = function(input) {
    return AppSecurity ? AppSecurity.sanitizeInput(input) : input;
};

window.validateEmail = function(email) {
    return AppSecurity ? AppSecurity.validateEmail(email) : false;
};

window.validatePassword = function(password) {
    return AppSecurity ? AppSecurity.validatePassword(password) : false;
};

window.escapeHtml = function(unsafe) {
    return AppSecurity ? AppSecurity.escapeHtml(unsafe) : unsafe;
};

window.validateFormData = function(formData) {
    return AppSecurity ? AppSecurity.validateFormData(formData) : { isValid: true, errors: [] };
};

// ========== التعامل مع إغلاق الصفحة ==========
window.addEventListener('beforeunload', function() {
    if (AppSecurity) {
        AppSecurity.cleanup();
    }
});

// ========== تصدير الكلاس للاستخدام في الملفات الأخرى ==========
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecuritySystem;
}
