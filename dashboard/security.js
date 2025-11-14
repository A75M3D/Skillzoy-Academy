// ========== نظام الأمان المتوازن - متوافق مع Supabase ==========
class SupabaseFriendlySecurity {
    constructor() {
        this.allowedDomains = [
            'supabase.co',
            'supabase.com', 
            'youtube.com',
            'youtu.be',
            'www.googleapis.com',
            'fonts.googleapis.com',
            'fonts.gstatic.com'
        ];
        this.init();
    }

    init() {
        console.log('🛡️ نظام الأمان المتوازن - متوافق مع Supabase');
        this.setupSmartCSRF();
        this.setupNonIntrusiveProtection();
    }

    // ========== 1. حماية CSRF ذكية (لا تؤثر على APIs الخارجية) ==========
    setupSmartCSRF() {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const url = args[0];
            const requestOptions = args[1] || {};
            
            // ✅ لا نضيف CSRF للطلبات الخارجية
            if (this.isInternalRequest(url) && this.requiresCSRF(requestOptions)) {
                requestOptions.headers = {
                    ...requestOptions.headers,
                    'X-CSRF-Token': this.generateCSRFToken()
                };
            }
            
            return originalFetch.apply(this, [url, requestOptions]);
        };
    }

    isInternalRequest(url) {
        // ✅ الطلبات الداخلية فقط (نفس النطاق)
        if (typeof url !== 'string') return false;
        
        const requestHostname = new URL(url, window.location.origin).hostname;
        const currentHostname = window.location.hostname;
        
        // ✅ إذا كان الطلب لنفس النطاق أو localhost
        if (requestHostname === currentHostname || 
            requestHostname === 'localhost' || 
            requestHostname === '127.0.0.1') {
            return true;
        }
        
        // ❌ الطلبات لـ Supabase وYouTube وغيرها تعتبر خارجية
        return false;
    }

    requiresCSRF(requestOptions) {
        const method = requestOptions.method?.toUpperCase();
        return ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
    }

    generateCSRFToken() {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    // ========== 2. حماية غير متطفلة ==========
    setupNonIntrusiveProtection() {
        this.setupSelectiveContextMenu();
        this.setupCopyProtection();
    }

    setupSelectiveContextMenu() {
        document.addEventListener('contextmenu', (e) => {
            if (e.target.classList.contains('protected') || 
                e.target.closest('.protected')) {
                e.preventDefault();
                this.showToast('❌ هذا الإجراء غير مسموح هنا', 'warning', 2000);
            }
        });
    }

    setupCopyProtection() {
        document.addEventListener('copy', (e) => {
            if (e.target.classList.contains('no-copy') || 
                e.target.closest('.no-copy')) {
                e.preventDefault();
                this.showToast('❌ النسخ غير مسموح من هذا المحتوى', 'warning', 2000);
            }
        });
    }

    // ========== 3. دوال الأمان الأساسية ==========
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

    // ========== 4. أدوات مساعدة ==========
    showToast(message, type = 'info', duration = 3000) {
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

    // ========== 5. فحص الاتصال بـ Supabase ==========
    async testSupabaseConnection() {
        try {
            const response = await fetch('https://your-project.supabase.co/rest/v1/', {
                method: 'GET',
                headers: {
                    'apikey': 'your-anon-key',
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                console.log('✅ الاتصال مع Supabase يعمل بشكل صحيح');
                return true;
            } else {
                console.warn('⚠️ مشكلة في الاتصال مع Supabase');
                return false;
            }
        } catch (error) {
            console.error('❌ فشل الاتصال مع Supabase:', error);
            return false;
        }
    }
}

// ========== التهيئة الآمنة ==========
let Security;

document.addEventListener('DOMContentLoaded', function() {
    try {
        Security = new SupabaseFriendlySecurity();
        
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
        
        console.log('✅ نظام الأمان الجديد شغال - متوافق مع Supabase');
        
        // اختبار الاتصال بعد التحميل
        setTimeout(() => Security.testSupabaseConnection(), 1000);
        
    } catch (error) {
        console.warn('⚠️ نظام الأمان لم يتم تحميله، لكن الموقع سيستمر في العمل:', error);
    }
});

// ========== جعل الدوال متاحة بشكل آمن ==========
window.safeHTML = (str) => Security ? Security.safeHTML(str) : (str || '');
window.sanitizeInput = (input) => Security ? Security.sanitizeInput(input) : (input || '');
window.validateEmail = (email) => Security ? Security.validateEmail(email) : false;
window.validatePassword = (password) => Security ? Security.validatePassword(password) : false;
window.escapeHtml = (unsafe) => Security ? Security.escapeHtml(unsafe) : (unsafe || '');

// ========== التأكد من أن الموقع يعمل حتى إذا فشل الأمان ==========
window.addEventListener('error', (e) => {
    if (e.message && e.message.includes('Security')) {
        console.log('🛡️ خطأ في نظام الأمان تم احتواؤه');
        e.preventDefault();
    }
});
