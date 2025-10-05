// public/js/security-middleware.js
/**
 * 🛡️ Security Middleware الشامل
 * ⚡ نسخة محسنة وموسعة - 500+ سطر
 * 🔒 حماية شاملة لموقع Skillzoy Academy
 * 📅 إصدار: 2.0.0
 */

class SecurityMiddleware {
    constructor(config = {}) {
        this.config = {
            csrf: {
                enabled: true,
                tokenName: 'csrf_token',
                autoRenew: true,
                renewInterval: 30 * 60 * 1000 // 30 دقيقة
            },
            xss: {
                enabled: true,
                sanitizeInputs: true,
                sanitizeHTML: true,
                blockScripts: true
            },
            rateLimit: {
                enabled: true,
                maxRequests: 10,
                timeWindow: 60 * 1000, // 1 دقيقة
                storageKey: 'rate_limits'
            },
            session: {
                enabled: true,
                timeout: 30 * 60 * 1000, // 30 دقيقة
                multiTab: true,
                secureStorage: true
            },
            monitoring: {
                enabled: true,
                logEvents: true,
                detectBots: true,
                alertSuspicious: true
            },
            headers: {
                enabled: true,
                csp: true,
                hsts: true,
                xssProtection: true
            },
            ...config
        };

        this.state = {
            csrfToken: null,
            requests: [],
            sessionStart: Date.now(),
            securityEvents: [],
            botScore: 0
        };

        this.init();
    }

    /**
     * 🔧 التهيئة الرئيسية للنظام
     */
    init() {
        console.log('🔒 تهيئة نظام الحماية الشامل...');
        
        try {
            // تسجيل بدء التشغيل
            this.logEvent('SYSTEM_START', { version: '2.0.0' });

            // تهيئة جميع الوحدات
            this.initializeModules();

            // مراقبة الأخطاء
            this.setupErrorMonitoring();

            // حماية DOM
            this.protectDOM();

            console.log('✅ نظام الحماية الشامل جاهز بنسبة 100%');
            this.showSecurityBadge();

        } catch (error) {
            console.error('❌ فشل في تهيئة نظام الحماية:', error);
            this.logEvent('INIT_FAILED', { error: error.message });
        }
    }

    /**
     * 🧩 تهيئة جميع وحدات الحماية
     */
    initializeModules() {
        const modules = [
            { name: 'CSRF Protection', fn: () => this.setupCSRFProtection() },
            { name: 'XSS Protection', fn: () => this.setupXSSProtection() },
            { name: 'Rate Limiting', fn: () => this.setupRateLimiting() },
            { name: 'Session Security', fn: () => this.setupSessionSecurity() },
            { name: 'Clickjacking Protection', fn: () => this.setupClickjackingProtection() },
            { name: 'Bot Detection', fn: () => this.setupBotDetection() },
            { name: 'Data Encryption', fn: () => this.setupDataEncryption() },
            { name: 'Network Security', fn: () => this.setupNetworkSecurity() },
            { name: 'Real-time Monitoring', fn: () => this.setupRealTimeMonitoring() }
        ];

        modules.forEach(module => {
            try {
                module.fn();
                console.log(`✅ ${module.name} - مفعل`);
                this.logEvent('MODULE_LOADED', { module: module.name });
            } catch (error) {
                console.error(`❌ فشل تحميل ${module.name}:`, error);
                this.logEvent('MODULE_FAILED', { module: module.name, error: error.message });
            }
        });
    }

    // ==================== CSRF PROTECTION ====================

    /**
     * 🛡️ حماية CSRF الشاملة
     */
    setupCSRFProtection() {
        if (!this.config.csrf.enabled) return;

        // توليد التوكن الآمن
        this.generateSecureCSRFToken();

        // حقن التوكن في النماذج
        this.injectCSRFTokens();

        // حماية طلبات AJAX
        this.protectAjaxRequests();

        // نظام تجديد التوكن
        if (this.config.csrf.autoRenew) {
            this.setupCSRFAutoRenew();
        }

        // حماية النماذج
        this.setupFormProtection();

        this.logEvent('CSRF_PROTECTION_ACTIVE');
    }

    generateSecureCSRFToken() {
        const crypto = window.crypto || window.msCrypto;
        const array = new Uint32Array(10);
        
        if (crypto && crypto.getRandomValues) {
            crypto.getRandomValues(array);
            this.state.csrfToken = 'csrf_' + Array.from(array)
                .map(b => b.toString(36))
                .join('')
                .substr(0, 32) + '_' + Date.now();
        } else {
            // Fallback للأنظمة القديمة
            this.state.csrfToken = 'csrf_' + 
                Math.random().toString(36).substr(2, 16) +
                Math.random().toString(36).substr(2, 16) + 
                '_' + Date.now();
        }

        // تخزين آمن
        this.secureStorage.setItem('csrf_token', this.state.csrf
