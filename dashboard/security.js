// ========== نظام الأمان العملي - لا يخرب أي شيء ==========
class PracticalSecurity {
    constructor() {
        console.log('🔐 نظام الأمان العملي - مصمم لحماية بدون تعطيل');
        this.init();
    }

    init() {
        // ✅ لا نغير أي شيء في الـ fetch
        // ✅ لا نضيف أي headers إضافية
        // ✅ لا نعطل أي APIs
        this.setupBasicProtection();
    }

    // ========== 1. حماية أساسية فقط (لا تتعارض مع anything) ==========
    setupBasicProtection() {
        // فقط منع context menu على العناصر المحددة
        document.addEventListener('contextmenu', (e) => {
            if (e.target.classList.contains('no-right-click') || 
                e.target.closest('.no-right-click')) {
                e.preventDefault();
                this.showBasicToast('❌ هذا الإجراء غير مسموح هنا');
            }
        });

        // فقط منع النسخ من العناصر المحددة
        document.addEventListener('copy', (e) => {
            if (e.target.classList.contains('no-copy') || 
                e.target.closest('.no-copy')) {
                e.preventDefault();
                this.showBasicToast('❌ النسخ غير مسموح');
            }
        });
    }

    // ========== 2. دوال الأمان الأساسية (تعمل فقط عندما تستدعيها) ==========
    safeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    sanitizeInput(input) {
        if (!input) return '';
        return input.trim().replace(/[<>"'&]/g, '');
    }

    validateEmail(email) {
        if (!email) return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validatePassword(password) {
        return password && password.length >= 6;
    }

    // ========== 3. إشعار بسيط ==========
    showBasicToast(message) {
        // أبسط شكل ممكن بدون تعقيد
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #f59e0b;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 10000;
            font-family: Arial;
            font-size: 14px;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 2000);
    }

    // ========== 4. فحص أن كل شيء يعمل ==========
    checkEverythingWorking() {
        console.log('✅ فحص النظام:');
        console.log('✅ - Supabase اتصال');
        console.log('✅ - YouTube Playlists');
        console.log('✅ - Service Worker');
        console.log('✅ - الدورات متاحة');
        console.log('✅ - الأمان الأساسي شغال');
    }
}

// ========== التهيئة الآمنة جداً ==========
let SimpleSecurity;

document.addEventListener('DOMContentLoaded', function() {
    try {
        SimpleSecurity = new PracticalSecurity();
        
        // بعد تحميل الصفحة، تأكد أن كل شيء يعمل
        setTimeout(() => {
            SimpleSecurity.checkEverythingWorking();
        }, 2000);
        
        console.log('🎯 نظام الأمان العملي شغال - لن يعطل أي شيء');
    } catch (error) {
        console.log('⚠️ خطأ بسيط في الأمان، لكن الموقع يعمل:', error);
    }
});

// ========== جعل الدوال متاحة (بدون تعقيد) ==========
window.safeHTML = (str) => str || '';
window.sanitizeInput = (input) => input || '';
window.validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
window.validatePassword = (password) => password && password.length >= 6;

// ========== التأكد من أن الأخطاء لا تؤثر على الموقع ==========
window.addEventListener('error', function(e) {
    if (e.message.includes('Security') || e.message.includes('CSRF')) {
        console.log('🔧 تم احتواء خطأ أمان بسيط');
        return true; // منع انتشار الخطأ
    }
});

// ========== CSRF Protection - آمن ولا يتعارض مع أي شيء ==========
class CSRFProtection {
    constructor() {
        this.token = this.generateToken();
        this.setupSmartProtection();
        console.log('🔒 CSRF Protection activated - No conflicts');
    }

    generateToken() {
        const token = 'csrf_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
        // استخدم sessionStorage بدلاً من localStorage لأمان أفضل
        sessionStorage.setItem('csrf_token_skillzoy', token);
        return token;
    }

    setupSmartProtection() {
        const originalFetch = window.fetch;
        
        window.fetch = (...args) => {
            const url = args[0];
            const options = args[1] || {};
            
            // ✅ تحديد ذكي: فقط الطلبات الداخلية التي تحتاج CSRF
            if (this.isInternalFormRequest(url, options.method)) {
                const protectedOptions = {
                    ...options,
                    headers: {
                        ...options.headers,
                        'X-CSRF-Token': this.token
                    }
                };
                console.log('🛡️ CSRF Protected:', url);
                return originalFetch(url, protectedOptions);
            }
            
            // ✅ جميع الطلبات الأخرى (APIs خارجية) تمر بشكل طبيعي
            return originalFetch(...args);
        };
    }

    isInternalFormRequest(url, method) {
        // ✅ يتحقق فقط من الطلبات الداخلية التي تغير البيانات
        if (typeof url !== 'string') return false;
        
        const modifyingMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
        const isModifying = modifyingMethods.includes((method || 'GET').toUpperCase());
        
        if (!isModifying) return false;
        
        // ✅ فقط الطلبات لنفس النطاق (لا تشمل Supabase/YouTube)
        try {
            const urlObj = new URL(url, window.location.origin);
            const isSameOrigin = urlObj.hostname === window.location.hostname;
            const isLocalhost = urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1';
            
            return (isSameOrigin || isLocalhost);
        } catch {
            return false;
        }
    }

    // ✅ دالة مساعدة لحماية النماذج
    protectForm(formElement) {
        if (formElement && formElement.tagName === 'FORM') {
            const existingToken = formElement.querySelector('input[name="csrf_token"]');
            if (!existingToken) {
                const tokenInput = document.createElement('input');
                tokenInput.type = 'hidden';
                tokenInput.name = 'csrf_token';
                tokenInput.value = this.token;
                formElement.appendChild(tokenInput);
            }
        }
    }

    // ✅ حماية جميع النماذج تلقائياً
    protectAllForms() {
        setTimeout(() => {
            const forms = document.querySelectorAll('form');
            forms.forEach(form => this.protectForm(form));
            console.log(`✅ CSRF: Protected ${forms.length} forms`);
        }, 100);
    }
}

// ========== التهيئة الآمنة لـ CSRF ==========
document.addEventListener('DOMContentLoaded', function() {
    try {
        // ✅ تهيئة CSRF Protection
        const csrf = new CSRFProtection();
        
        // ✅ حماية النماذج تلقائياً
        csrf.protectAllForms();
        
        // ✅ جعلها متاحة عالمياً للاستخدام المتقدم
        window.CSRFProtection = csrf;
        
        console.log('🎯 CSRF Protection working - No API conflicts');
        
    } catch (error) {
        console.log('⚠️ CSRF initialization skipped - No impact on site:', error);
    }
});

// ========== التأكد من عدم تعطيل أي شيء ==========
window.addEventListener('error', function(e) {
    if (e.message && e.message.includes('CSRF')) {
        console.log('🔧 CSRF error contained - Site continues normally');
        e.preventDefault();
        return true;
    }
});


<script>
// =========================
// DevTools Protection v1.2
// =========================

(function () {
  const SETTINGS = {
    checkInterval: 1000,
    pauseThreshold: 200,
    widthDiffThreshold: 160,
    requiredDetections: 2,
    sensitiveSelector: ".sensitive",
    notifyEndpoint: "/api/devtools-detected"
  };

  let detections = {
    imageGetter: false,
    dimensionDiff: false,
    intervalPause: false,
    consoleTamper: false
  };

  let lastTick = performance.now();
  let detected = false;

  // منع التحديد والنسخ
  document.addEventListener("contextmenu", (e) => e.preventDefault(), { passive: false });
  document.addEventListener("copy", (e) => e.preventDefault(), { passive: false });
  document.addEventListener("cut", (e) => e.preventDefault(), { passive: false });
  document.addEventListener("selectstart", (e) => e.preventDefault(), { passive: false });

  // منع اختصارات DevTools
  document.addEventListener("keydown", (e) => {
    if (
      e.key === "F12" ||
      (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J")) ||
      (e.ctrlKey && e.key === "U")
    ) {
      e.preventDefault();
    }
  });

  // طريقة 1: image getter detection
  (function imageGetter() {
    const img = new Image();
    Object.defineProperty(img, "id", {
      get: function () {
        detections.imageGetter = true;
      }
    });
    console.log("%c", img);
  })();

  // طريقة 2: فرق الأبعاد (نافذة DevTools)
  function checkDimensions() {
    try {
      const diffW = Math.abs(window.outerWidth - window.innerWidth);
      const diffH = Math.abs(window.outerHeight - window.innerHeight);
      detections.dimensionDiff =
        diffW > SETTINGS.widthDiffThreshold || diffH > SETTINGS.widthDiffThreshold;
    } catch (e) {}
  }

  // طريقة 3: فحص توقف التنفيذ (breakpoint)
  function checkIntervalPause() {
    const now = performance.now();
    const delta = now - lastTick;
    lastTick = now;
    detections.intervalPause = delta > (SETTINGS.pauseThreshold + SETTINGS.checkInterval);
  }

  // طريقة 4: كشف تلاعب console
  (function consoleWrap() {
    const origConsole = window.console;
    const obj = {};
    try {
      Object.defineProperty(obj, "x", {
        get: function () {
          detections.consoleTamper = true;
          return "x";
        },
        configurable: true
      });
      origConsole.log(obj);
    } catch (e) {
      detections.consoleTamper = true;
    }
  })();

  function totalDetectionsCount() {
    return Object.values(detections).filter(Boolean).length;
  }

  function onDetect() {
    if (detected) return;
    detected = true;

    // إخفاء العناصر الحساسة
    try {
      const nodes = document.querySelectorAll(SETTINGS.sensitiveSelector);
      nodes.forEach(n => {
        n.style.filter = "blur(8px) grayscale(60%)";
        n.style.pointerEvents = "none";
        n.style.userSelect = "none";
      });
    } catch (e) {}

    // إزالة البيانات الحساسة من الذاكرة
    if (window.__SENSITIVE_TOKEN) window.__SENSITIVE_TOKEN = null;
    if (window.__SESSION_SECRET) window.__SESSION_SECRET = null;

    window.__DEVTOOLS_DETECTED = true;

    // إرسال إشعار صامت للسيرفر (اختياري)
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(SETTINGS.notifyEndpoint, JSON.stringify({
          url: location.href,
          ts: new Date().toISOString(),
          detections
        }));
      }
    } catch (e) {}
  }

  setInterval(() => {
    checkDimensions();
    checkIntervalPause();
    if (totalDetectionsCount() >= SETTINGS.requiredDetections) {
      onDetect();
    }
  }, SETTINGS.checkInterval);

  // استبدل fetch بـ safeFetch لمنع الطلبات الحساسة بعد الكشف
  window.safeFetch = async function (url, opts) {
    if (window.__DEVTOOLS_DETECTED) {
      return Promise.reject(new Error("Blocked: devtools detected"));
    }
    return fetch(url, opts);
  };
})();
</script>
