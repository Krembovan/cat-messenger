export const Helpers = {
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    formatDate(date) {
        return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    },
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => { clearTimeout(timeout); func(...args); };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    },
    
    showToast(text) {
        const toast = document.createElement('div');
        toast.className = 'notification';
        toast.textContent = text;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    },
    
    nameToColor(name) {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const colors = [
            '#3b82f6','#ef4444','#22c55e','#f59e0b','#8b5cf6',
            '#ec4899','#06b6d4','#f97316','#6366f1','#14b8a6',
            '#e11d48','#7c3aed','#0ea5e9','#d946ef','#10b981'
        ];
        return colors[Math.abs(hash) % colors.length];
    },
    
    getInitials(name) {
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    },
    
    avatarHtml(name, size, extraClass) {
        const initials = this.getInitials(name);
        const color = this.nameToColor(name);
        const cls = extraClass ? `avatar-initial ${extraClass}` : 'avatar-initial';
        return `<span class="${cls}" style="background:${color};width:${size}px;height:${size}px;font-size:${Math.round(size * 0.34)}px">${initials}</span>`;
    },
    
    avatarImg(name, size, extraClass) {
        return this.avatarHtml(name, size, extraClass);
    }
};
