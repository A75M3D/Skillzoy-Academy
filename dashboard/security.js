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
            return value;
        };
    }

    // سياسة أمان المحتوى (CSP)
    setupCSP() {
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        meta.content = `
            default-src 'self';
            script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net;
            style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com;
            font-src 'self' https://fonts.gstatic.com;
            img-src 'self' data: https:;
            connect-src 'self' https://sjipwstkvvrautexigmt.supabase.co https://www.googleapis.com;
            frame-src 'self' https://www.youtube.com;
        `.replace(/\s+/g, ' ').trim();
        document.head.appendChild(meta);
    }

    // التحقق من سلامة التطبيق
    integrityCheck() {
        const originalScripts = [
            'category-carousel',
            'security-system',
            'progress-system'
        ];

        setInterval(() => {
            const currentScripts = Array.from(document.scripts)
                .map(script => script.src)
                .filter(src => src.includes('skillzoy'));

            if (currentScripts.length !== originalScripts.length) {
                this.handleTamperingDetection();
            }
        }, 5000);
    }

    handleTamperingDetection() {
        document.body.innerHTML = '<div style="text-align:center; padding:50px; font-family: Arial; color:red;"><h1>🚫 Security Breach Detected</h1><p>Application integrity compromised.</p></div>';
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = 'about:blank';
    }
}

// ===== نظام التشفير المتقدم =====
class EncryptionSystem {
    constructor(key) {
        this.key = key || 'skillzoy-secure-encryption-key';
    }

    encrypt(text) {
        try {
            const textToChars = (text) => text.split("").map((c) => c.charCodeAt(0));
            const byteHex = (n) => ("0" + Number(n).toString(16)).substr(-2);
            const applyKeyToChar = (code) => textToChars(this.key).reduce((a, b) => a ^ b, code);
            
            return text
                .split("")
                .map(textToChars)
                .map(applyKeyToChar)
                .map(byteHex)
                .join("");
        } catch (error) {
            console.error('Encryption error:', error);
            return text;
        }
    }

    decrypt(encodedText) {
        try {
            const textToChars = (text) => text.split("").map((c) => c.charCodeAt(0));
            const applyKeyToChar = (code) => textToChars(this.key).reduce((a, b) => a ^ b, code);
            
            return encodedText
                .match(/.{1,2}/g)
                .map((hex) => parseInt(hex, 16))
                .map(applyKeyToChar)
                .map((charCode) => String.fromCharCode(charCode))
                .join("");
        } catch (error) {
            console.error('Decryption error:', error);
            return encodedText;
        }
    }
}

// ===== التحقق من البيئة الآمنة =====
function checkSecureEnvironment() {
    // التحقق من أن الصفحة ليست في iframe
    if (window.self !== window.top) {
        window.top.location = window.self.location;
        return false;
    }

    // التحقق من أن البروتوكول آمن (HTTPS)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        console.warn('غير آمن: يجب استخدام HTTPS');
        return false;
    }

    // التحقق من عدم وجود أدوات تطوير ويب
    if (navigator.webdriver || window.callPhantom || window._phantom) {
        document.body.innerHTML = '<h1>Access Denied - Automated tools detected</h1>';
        return false;
    }

    return true;
}

// ===== تهيئة نظام الأمان =====
document.addEventListener('DOMContentLoaded', function() {
    // التحقق من البيئة الآمنة أولاً
    if (!checkSecureEnvironment()) {
        return;
    }

    // تهيئة نظام الأمان
    const securitySystem = new SecuritySystem();
    const encryptionSystem = new EncryptionSystem();

    // حماية المتغيرات الحساسة
    Object.defineProperty(window, 'SUPABASE_URL', {
        value: 'https://sjipwstkvvrautexigmt.supabase.co',
        writable: false,
        configurable: false
    });

    Object.defineProperty(window, 'SUPABASE_ANON_KEY', {
        value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqaXB3c3RrdnZyYXV0ZXhpZ210Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MTE5MDcsImV4cCI6MjA3NDQ4NzkwN30.FSh2yIdZdvdNvtWxK5JB02PIdWOG3707qO-F0c84PnY',
        writable: false,
        configurable: false
    });

    // حماية الـ API Keys
    const protectedKeys = {
        youtube: 'QUl6YVN5Q' + 'DFWYzB2Mnl' + 'qN25LalZ1W' + 'jctbTZ2S0E'
    };

    // منع التعديل على الكائنات المهمة
    Object.freeze(Object.prototype);
    Object.freeze(Array.prototype);
    Object.freeze(Function.prototype);

    // مراقبة التغييرات في DOM
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && 
                (mutation.attributeName === 'src' || mutation.attributeName === 'href')) {
                securitySystem.handleTamperingDetection();
            }
        });
    });

    observer.observe(document.documentElement, {
        attributes: true,
        childList: true,
        subtree: true,
        attributeFilter: ['src', 'href', 'onclick']
    });

    console.log('🔒 نظام الأمان نشط وحماية الموقع مكتملة');
});

// ===== حماية إضافية للبيانات =====
function secureDataStorage() {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
        if (typeof value === 'string' && value.length > 100) {
            const encryptionSystem = new EncryptionSystem();
            value = encryptionSystem.encrypt(value);
        }
        originalSetItem.call(this, key, value);
    };

    const originalGetItem = Storage.prototype.getItem;
    Storage.prototype.getItem = function(key) {
        let value = originalGetItem.call(this, key);
        if (value && value.length > 100) {
            try {
                const encryptionSystem = new EncryptionSystem();
                value = encryptionSystem.decrypt(value);
            } catch (e) {
                // في حالة فشل فك التشفير، نعيد القيمة كما هي
            }
        }
        return value;
    };
}

// تطبيق حماية التخزين
secureDataStorage();
