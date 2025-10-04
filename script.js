// أضف هذا الكود في بداية ملف script.js
function safeHTML(str) {
    if (!str) return '';
    
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// أو استخدام textContent مباشرة
function displaySafeText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
    }
}
