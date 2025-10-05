// public/js/security.js - حماية خفيفة ومتوافقة
class SimpleSecurity {
    constructor() {
        this.init();
    }

    init() {
        console.log('🔒 تهيئة الحماية الأساسية...');
        this.setupCSRF();
        this.setupXSS();
        this.setupRateLimit();
        this.setupSession();
    }

    // CSRF Protection
    setupCSRF() {
        this.csrfToken = this.generateToken();
        sessionStorage.setItem('csrf_token', this.csrfToken);
        this.injectCSRF();
    }

    generateToken() {
        return 'csrf_' + Math.random().toString(36).substr(2, 16);
    }

    injectCSRF() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'csrf_token';
            input.value = this.csrfToken;
            form.appendChild(input);
        });
    }

    // XSS Protection
    setupXSS() {
        document.querySelectorAll('input, textarea').forEach(input => {
            input.addEventListener('input', (e) => {
                e.target.value = e.target.value
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/'/g, '&#x27;')
                    .replace(/"/g, '&quot;');
            });
        });
    }

    // Rate Limiting
    setupRateLimit() {
        this.requests = JSON.parse(localStorage.getItem('requests') || '[]');
        
        document.addEventListener('submit', (e) => {
            if (!this.checkLimit()) {
                e.preventDefault();
                alert('⏰ كثرة الطلبات. انتظر قليلاً.');
            }
        });
    }

    checkLimit() {
        const now = Date.now();
        this.requests = this.requests.filter(time => now - time < 60000);
        
        if (this.requests.length >= 5) return false;
        
        this.requests.push(now);
        localStorage.setItem('requests', JSON.stringify(this.requests));
        return true;
    }

    // Session Security
    setupSession() {
        let timeout;
        const reset = () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                this.cleanup();
                window.location.reload();
            }, 1800000); // 30 دقيقة
        };

        ['click', 'keypress', 'mousemove'].forEach(ev => {
            document.addEventListener(ev, reset);
        });
        reset();
    }

    cleanup() {
        sessionStorage.removeItem('csrf_token');
        localStorage.removeItem('requests');
    }
}

// التحميل التلقائي
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.simpleSecurity = new SimpleSecurity();
    });
} else {
    window.simpleSecurity = new SimpleSecurity();
}
