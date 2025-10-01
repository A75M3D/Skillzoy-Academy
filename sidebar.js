// sidebar.js
class SidebarManager {
    constructor() {
        this.sidebar = document.getElementById('sidebar');
        this.overlay = document.getElementById('sidebarOverlay');
        this.closeBtn = document.getElementById('sidebarClose');
        this.isOpen = false;
        
        this.init();
    }
    
    init() {
        // إضافة زر فتح الشريط في ال header
        this.addSidebarToggle();
        
        // إضافة مستمعي الأحداث
        this.bindEvents();
        
        // تهيئة التنقل النشط
        this.setActiveNav();
    }
    
    addSidebarToggle() {
        const header = document.querySelector('.header .nav-container');
        if (header && !document.getElementById('sidebarToggle')) {
            const toggleBtn = document.createElement('button');
            toggleBtn.id = 'sidebarToggle';
            toggleBtn.className = 'sidebar-toggle';
            toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
            toggleBtn.setAttribute('aria-label', 'فتح القائمة الجانبية');
            
            // إضافة التنسيق لزر الفتح
            const style = document.createElement('style');
            style.textContent = `
                .sidebar-toggle {
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    color: white;
                    width: 45px;
                    height: 45px;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                    backdrop-filter: blur(10px);
                }
                
                .sidebar-toggle:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: scale(1.1);
                }
                
                @media (max-width: 768px) {
                    .sidebar-toggle {
                        width: 40px;
                        height: 40px;
                    }
                }
            `;
            document.head.appendChild(style);
            
            header.appendChild(toggleBtn);
        }
    }
    
    bindEvents() {
        // فتح الشريط الجانبي
        document.addEventListener('click', (e) => {
            if (e.target.closest('#sidebarToggle') || e.target.closest('.sidebar-toggle')) {
                this.openSidebar();
            }
        });
        
        // إغلاق الشريط الجانبي
        this.closeBtn.addEventListener('click', () => this.closeSidebar());
        this.overlay.addEventListener('click', () => this.closeSidebar());
        
        // إغلاق بالزر Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeSidebar();
            }
        });
        
        // منع إغلاق الشريط عند النقر داخله
        this.sidebar.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    
    openSidebar() {
        this.sidebar.classList.add('active');
        this.overlay.classList.add('active');
        this.isOpen = true;
        document.body.style.overflow = 'hidden';
        
        // إضافة تأثير دخول
        this.animateSidebarItems();
    }
    
    closeSidebar() {
        this.sidebar.classList.remove('active');
        this.overlay.classList.remove('active');
        this.isOpen = false;
        document.body.style.overflow = '';
    }
    
    animateSidebarItems() {
        const items = this.sidebar.querySelectorAll('.nav-item, .progress-item, .suggested-course, .notification-item');
        items.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateX(20px)';
            item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            
            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'translateX(0)';
            }, 100 + (index * 50));
        });
    }
    
    setActiveNav() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navItems = this.sidebar.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            const href = item.getAttribute('href');
            if (href === currentPage) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
    
    // تحديث معلومات المستخدم
    updateUserProfile(userData) {
        const userInfo = this.sidebar.querySelector('.user-info');
        if (userData.name) {
            userInfo.querySelector('h4').textContent = userData.name;
        }
        if (userData.status) {
            userInfo.querySelector('p').textContent = userData.status;
        }
        if (userData.level) {
            userInfo.querySelector('.user-level').textContent = `المستوى: ${userData.level}`;
        }
    }
    
    // تحديث التقدم الدراسي
    updateProgress(courseProgress) {
        const progressItems = this.sidebar.querySelectorAll('.progress-item');
        courseProgress.forEach((progress, index) => {
            if (progressItems[index]) {
                progressItems[index].querySelector('span:first-child').textContent = progress.course;
                progressItems[index].querySelector('.progress-fill').style.width = progress.percentage + '%';
                progressItems[index].querySelector('span:last-child').textContent = progress.percentage + '%';
            }
        });
    }
}

// الدوال العامة للاستخدام
function openSettings() {
    alert('سيتم فتح صفحة الإعدادات قريباً');
    // window.location.href = 'settings.html';
}

function openHelp() {
    alert('مرحباً بك في مركز المساعدة');
    // window.location.href = 'help.html';
}

function logout() {
    if (confirm('هل تريد تسجيل الخروج؟')) {
        // هنا يمكنك إضافة منطق تسجيل الخروج
        console.log('جاري تسجيل الخروج...');
        window.location.href = 'login.html';
    }
}

// تهيئة الشريط الجانبي عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    window.sidebarManager = new SidebarManager();
    
    // يمكنك تحديث البيانات ديناميكياً هكذا:
    /*
    sidebarManager.updateUserProfile({
        name: 'محمد أحمد',
        status: 'طالب متميز',
        level: 'متوسط'
    });
    
    sidebarManager.updateProgress([
        { course: 'Python للمبتدئين', percentage: 85 },
        { course: 'تصميم UI/UX', percentage: 60 },
        { course: 'التسويق الرقمي', percentage: 30 }
    ]);
    */
});
