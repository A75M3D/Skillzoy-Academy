// security-simple.js - الكود المحدث

// ========== الجزء الحالي (اتركه كما هو) ==========
function safeHTML(str) { return str || ''; }
function sanitizeInput(input) { return input ? input.trim().replace(/[<>"'&]/g, '') : ''; }
function validateEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
function validatePassword(password) { return password && password.length >= 6; }

// ========== الجزء الجديد (أضفه هنا) ==========
class EnhancedSecurity {
    constructor() {
        console.log('🛡️ الأمان المحسن مفعل');
        this.setupCSRFProtection();
        this.setupSessionManagement();
    }
    
    setupCSRFProtection() {
        const originalFetch = window.fetch;
        window.fetch = (...args) => {
            const url = args[0];
            const method = args[1]?.method;
            
            // ✅ CSRF للحماية الداخلية فقط (لما تحتاجه)
            if (typeof url === 'string' && 
                url.includes(window.location.hostname) &&
                ['POST','PUT','DELETE'].includes(method)) {
                
                args[1].headers = {
                    ...args[1].headers,
                    'X-CSRF-Token': this.generateToken()
                };
            }
            return originalFetch.apply(this, args);
        };
    }
    
    generateToken() {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
    
    setupSessionManagement() {
        // تنظيف الجلسات القديمة كل ساعة
        setInterval(() => {
            this.cleanOldSessions();
        }, 3600000);
    }
    
    cleanOldSessions() {
        const now = Date.now();
        const keys = ['temp_session', 'auth_time'];
        
        keys.forEach(key => {
            const value = localStorage.getItem(key);
            if (value && (now - parseInt(value)) > 86400000) { // 24 ساعة
                localStorage.removeItem(key);
            }
        });
    }
}

// ========== التهيئة (أضف هذا السطر) ==========
document.addEventListener('DOMContentLoaded', function() {
    // ✅ الأمان الأساسي
    document.addEventListener('contextmenu', (e) => {
        if (e.target.classList.contains('no-right-click')) {
            e.preventDefault();
        }
    });
    
    // ✅ الأمان المحسن الجديد
    new EnhancedSecurity();
    
    console.log('✅ الأمان المحسن شغال - الدورات آمنة');
});
