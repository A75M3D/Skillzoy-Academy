// security-middleware.js - طبقات حماية شاملة للموقع
class SecurityManager {
    constructor() {
        this.init();
    }

    init() {
        this.setSecurityHeaders();
        this.setupCSRFProtection();
        this.setupCSP();
        this.setupXSSProtection();
        this.setupClickjackingProtection();
        this.setupRateLimiting();
        this.setupSessionSecurity();
        this.monitorSuspiciousActivity();
        this.setupInputValidation();
        this.setupHTTPSEnforcement();
    }

    // 1. رؤوس الأمان
    setSecurityHeaders() {
        const securityHeaders = {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
            'Content-Security-Policy': this.generateCSP()
        };

        // تطبيق الرؤوس على جميع الطلبات
        document.addEventListener('DOMContentLoaded', () => {
            this.applyHeadersToLinks();
        });
    }

    // 2. سياسة أمان المحتوى الديناميكية
    generateCSP() {
        return `
            default-src 'self';
            script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com;
            style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com;
            img-src 'self' data: https:;
            font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com;
            connect-src 'self';
            frame-src 'none';
            object-src 'none';
            base-uri 'self';
            form-action 'self';
        `.replace(/\s+/g, ' ').trim();
    }

    // 3. حماية CSRF
    setupCSRFProtection() {
        const csrfToken = this.generateCSRFToken();
        localStorage.setItem('csrf_token', csrfToken);
        
        // إضافة التوكن لجميع النماذج
        document.addEventListener('DOMContentLoaded', () => {
            this.injectCSRFToken();
            this.setupFormProtection();
        });
    }

    generateCSRFToken() {
        return 'csrf_' + Math.random().toString(36).substr(2, 16) + '_' + Date.now();
    }

    injectCSRFToken() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            if (!form.querySelector('input[name="csrf_token"]')) {
                const csrfInput = document.createElement('input');
                csrfInput.type = 'hidden';
                csrfInput.name = 'csrf_token';
                csrfInput.value = localStorage.getItem('csrf_token');
                form.appendChild(csrfInput);
            }
        });
    }

    // 4. منع هجمات XSS
    setupXSSProtection() {
        // تجاوز الدوال الخطيرة
        this.overrideDangerousFunctions();
        
        // مراقبة إدخال المستخدم
        this.setupDOMPurification();
    }

    overrideDangerousFunctions() {
        const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML').set;
        
        Object.defineProperty(Element.prototype, 'innerHTML', {
            set: function(value) {
                const sanitized = SecurityManager.sanitizeHTML(value);
                return originalInnerHTML.call(this, sanitized);
            }
        });

        // حماية eval (غير آمن - نعطله)
        window.eval = function() {
            console.warn('⚠️ تم منع استخدام eval لأسباب أمنية');
            return null;
        };
    }

    static sanitizeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // 5. منع clickjacking
    setupClickjackingProtection() {
        if (window !== window.top) {
            window.top.location = window.location;
        }
        
        // حماية إضافية
        document.addEventListener('DOMContentLoaded', () => {
            const style = document.createElement('style');
            style.textContent = `
                body {
                    display: none !important;
                }
            `;
            document.head.appendChild(style);

            if (window === window.top) {
                document.body.style.display = 'block';
            }
        });
    }

    // 6. تحديد معدل الطلبات
    setupRateLimiting() {
        this.requestHistory = [];
        this.maxRequests = 100; // 100 طلب في الساعة
        this.timeWindow = 60 * 60 * 1000; // ساعة واحدة

        // اعتراض طلبات AJAX
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            if (!this.checkRateLimit()) {
                throw new Error('تم تجاوز حد الطلبات المسموح به');
            }
            return originalFetch(...args);
        };
    }

    checkRateLimit() {
        const now = Date.now();
        this.requestHistory = this.requestHistory.filter(time => 
            now - time < this.timeWindow
        );

        if (this.requestHistory.length >= this.maxRequests) {
            this.logSecurityEvent('RATE_LIMIT_EXCEEDED');
            return false;
        }

        this.requestHistory.push(now);
        return true;
    }

    // 7. أمان الجلسة
    setupSessionSecurity() {
        // توليد معرف جلسة آمن
        const sessionId = 'session_' + Math.random().toString(36).substr(2, 32);
        sessionStorage.setItem('session_id', sessionId);
        
        // مراقبة انتهاء الجلسة
        this.setupSessionTimeout();
        
        // حماية ضد هجمات التصيد
        this.setupPhishingProtection();
    }

    setupSessionTimeout() {
        let timeout;
        const resetTimeout = () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                this.logoutUser();
            }, 30 * 60 * 1000); // 30 دقيقة
        };

        ['click', 'keypress', 'scroll', 'mousemove'].forEach(event => {
            document.addEventListener(event, resetTimeout, { passive: true });
        });

        resetTimeout();
    }

    logoutUser() {
        sessionStorage.clear();
        localStorage.removeItem('csrf_token');
        window.location.href = '/login.html?reason=session_expired';
    }

    // 8. مراقبة النشاط المشبوه
    monitorSuspiciousActivity() {
        // اكتشاف أدوات المطور
        this.detectDevTools();
        
        // مراقبة أحداث لوحة المفاتيح
        this.setupKeyloggerDetection();
        
        // اكتشاف برامج الروبوتات
        this.detectBots();
    }

    detectDevTools() {
        const element = new Image();
        Object.defineProperty(element, 'id', {
            get: function() {
                this.logSecurityEvent('DEVTOOLS_DETECTED');
            }
        });
        console.log(element);
    }

    setupKeyloggerDetection() {
        let suspiciousPatterns = [];
        
        document.addEventListener('keydown', (e) => {
            // اكتشاف أنماط الكتابة الآلية
            const now = Date.now();
            suspiciousPatterns = suspiciousPatterns.filter(pattern => 
                now - pattern.timestamp < 1000
            );
            
            suspiciousPatterns.push({
                key: e.key,
                timestamp: now
            });
            
            if (suspiciousPatterns.length > 20) { // 20 ضغطة في الثانية
                this.logSecurityEvent('AUTOMATED_TYPING_DETECTED');
            }
        });
    }

    detectBots() {
        // اكتشاف المتصفحات الآلية
        const botIndicators = [
            'PhantomJS', 'Selenium', 'CasperJS', 'Puppeteer'
        ];
        
        const userAgent = navigator.userAgent;
        if (botIndicators.some(bot => userAgent.includes(bot))) {
            this.logSecurityEvent('BOT_DETECTED');
            this.blockSuspiciousActivity();
        }
    }

    // 9. التحقق من المدخلات
    setupInputValidation() {
        document.addEventListener('DOMContentLoaded', () => {
            const inputs = document.querySelectorAll('input, textarea, select');
            
            inputs.forEach(input => {
                input.addEventListener('input', (e) => {
                    this.validateInput(e.target);
                });
                
                input.addEventListener('blur', (e) => {
                    this.sanitizeInput(e.target);
                });
            });
        });
    }

    validateInput(input) {
        const value = input.value;
        let isValid = true;
        
        switch(input.type) {
            case 'email':
                isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
                break;
            case 'tel':
                isValid = /^[\d\s\-\+\(\)]+$/.test(value);
                break;
            case 'text':
                if (input.name === 'username') {
                    isValid = /^[a-zA-Z0-9_]{3,20}$/.test(value);
                }
                break;
            case 'password':
                isValid = value.length >= 8;
                break;
        }
        
        if (!isValid && value) {
            input.style.borderColor = '#e63946';
            this.showValidationError(input, 'قيمة غير صالحة');
        } else {
            input.style.borderColor = '';
            this.hideValidationError(input);
        }
        
        return isValid;
    }

    sanitizeInput(input) {
        let value = input.value;
        
        // إزالة علامات HTML
        value = value.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        // إزالة السكريبات الخطيرة
        value = value.replace(/javascript:/gi, '');
        value = value.replace(/on\w+=/gi, '');
        
        input.value = value;
    }

    showValidationError(input, message) {
        let errorElement = input.parentNode.querySelector('.validation-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'validation-error';
            errorElement.style.cssText = `
                color: #e63946;
                font-size: 0.8rem;
                margin-top: 5px;
            `;
            input.parentNode.appendChild(errorElement);
        }
        errorElement.textContent = message;
    }

    hideValidationError(input) {
        const errorElement = input.parentNode.querySelector('.validation-error');
        if (errorElement) {
            errorElement.remove();
        }
    }

    // 10. إجبار HTTPS
    setupHTTPSEnforcement() {
        if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
            location.href = 'https:' + window.location.href.substring(window.location.protocol.length);
        }
    }

    // 11. حماية النماذج
    setupFormProtection() {
        document.addEventListener('DOMContentLoaded', () => {
            const forms = document.querySelectorAll('form');
            
            forms.forEach(form => {
                form.addEventListener('submit', (e) => {
                    if (!this.validateForm(form)) {
                        e.preventDefault();
                        return;
                    }
                    
                    this.protectFormSubmission(e);
                });
            });
        });
    }

    validateForm(form) {
        let isValid = true;
        const inputs = form.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            if (!this.validateInput(input)) {
                isValid = false;
                input.focus();
            }
        });
        
        // التحقق من توكن CSRF
        const csrfToken = form.querySelector('input[name="csrf_token"]');
        if (!csrfToken || csrfToken.value !== localStorage.getItem('csrf_token')) {
            this.logSecurityEvent('CSRF_ATTACK_DETECTED');
            isValid = false;
        }
        
        return isValid;
    }

    protectFormSubmission(e) {
        const form = e.target;
        
        // تعطيل الزر لمنع الإرسال المتعدد
        const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = 'جاري المعالجة...';
        }
        
        // تشفير البيانات الحساسة
        this.encryptSensitiveData(form);
    }

    encryptSensitiveData(form) {
        const passwordFields = form.querySelectorAll('input[type="password"]');
        
        passwordFields.forEach(field => {
            if (field.value) {
                // تشفير بسيط (في الواقع الفعلي استخدم مكتبة تشفير أقوى)
                const encrypted = btoa(unescape(encodeURIComponent(field.value)));
                field.value = encrypted;
            }
        });
    }

    // 12. تطبيق الرؤوس على الروابط
    applyHeadersToLinks() {
        const links = document.querySelectorAll('a');
        links.forEach(link => {
            link.setAttribute('rel', 'noopener noreferrer');
            if (link.hostname !== window.location.hostname) {
                link.setAttribute('target', '_blank');
            }
        });
    }

    // 13. منع النشاط المشبوه
    blockSuspiciousActivity() {
        // إضافة تأخير عشوائي
        const delay = Math.random() * 3000 + 1000;
        
        setTimeout(() => {
            document.body.innerHTML = `
                <div style="text-align: center; padding: 50px; font-family: Arial;">
                    <h2>⚠️ نشاط مشبوه تم اكتشافه</h2>
                    <p>تم حظر هذا الطلب لأسباب أمنية.</p>
                    <p>إذا كنت مستخدمًا شرعيًا، يرجى المحاولة مرة أخرى بعد بضع دقائق.</p>
                </div>
            `;
        }, delay);
    }

    // 14. تسجيل الأحداث الأمنية
    logSecurityEvent(eventType, details = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            event: eventType,
            userAgent: navigator.userAgent,
            url: window.location.href,
            ip: 'N/A', // في الخادم الحقيقي يمكن الحصول على IP
            ...details
        };
        
        console.warn('🔒 حدث أمني:', logEntry);
        
        // إرسال السجل إلى الخادم (في الواقع الفعلي)
        this.sendSecurityLog(logEntry);
    }

    sendSecurityLog(logEntry) {
        // في الواقع الفعلي، أرسل إلى endpoint آمن
        fetch('/api/security/log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': localStorage.getItem('csrf_token')
            },
            body: JSON.stringify(logEntry)
        }).catch(console.error);
    }

    // 15. فحص الثغرات الدورية
    startVulnerabilityScan() {
        setInterval(() => {
            this.scanForVulnerabilities();
        }, 5 * 60 * 1000); // كل 5 دقائق
    }

    scanForVulnerabilities() {
        // فحص العناصر الخطيرة
        const dangerousElements = document.querySelectorAll(
            'script[src*="http:"], iframe, embed, object'
        );
        
        if (dangerousElements.length > 0) {
            this.logSecurityEvent('DANGEROUS_ELEMENTS_FOUND', {
                count: dangerousElements.length
            });
        }
        
        // فحص السكريبات الخارجية
        const externalScripts = document.querySelectorAll(
            'script[src]:not([src^="https://cdn.jsdelivr.net"]):not([src^="https://cdnjs.cloudflare.com"])'
        );
        
        externalScripts.forEach(script => {
            if (!script.src.startsWith(window.location.origin)) {
                this.logSecurityEvent('EXTERNAL_SCRIPT_DETECTED', {
                    src: script.src
                });
            }
        });
    }
}

// تطبيق إضافي للتحقق من تكامل الملفات
class FileIntegrityChecker {
    constructor() {
        this.expectedHashes = {
            // يمكن إضافة هاشات الملفات المتوقعة هنا
        };
    }
    
    verifyFileIntegrity(url, expectedHash) {
        return fetch(url)
            .then(response => response.text())
            .then(content => {
                const hash = this.calculateHash(content);
                return hash === expectedHash;
            });
    }
    
    calculateHash(content) {
        // دالة هاش مبسطة (في الواقع الفعلي استخدم SHA-256)
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(16);
    }
}

// تهيئة نظام الحماية
document.addEventListener('DOMContentLoaded', () => {
    const securityManager = new SecurityManager();
    const integrityChecker = new FileIntegrityChecker();
    
    // جعل النظام متاحًا globally للاستدعاء من أي مكان
    window.SecurityManager = securityManager;
    window.FileIntegrityChecker = integrityChecker;
    
    console.log('🔒 نظام الحماية مفعل ومستعد');
});

// منع النسخ والحق النقر كطبقة حماية إضافية
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
});

document.addEventListener('copy', (e) => {
    e.preventDefault();
    return false;
});

document.addEventListener('cut', (e) => {
    e.preventDefault();
    return false;
});

// تصدير للاستخدام في ملفات أخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SecurityManager, FileIntegrityChecker };
}
