import { State } from '../state.js';
import { API } from '../api.js';
import { Helpers } from '../utils/helpers.js';

export const Utilities = {
    init() {
        this.setupKeyboardShortcuts();
        this.setupVoiceInput();
        this.setupImageCompression();
        this.setupAutoResponder();
    },
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'k':
                        e.preventDefault();
                        this.showGlobalSearch();
                        break;
                    case 'n':
                        e.preventDefault();
                        document.getElementById('newChatBtn')?.click();
                        break;
                    case 'e':
                        e.preventDefault();
                        this.exportCurrentChat();
                        break;
                    case ',':
                        e.preventDefault();
                        this.showSettings();
                        break;
                }
            }
            
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    },
    
    showGlobalSearch() {
        const modal = document.createElement('div');
        modal.className = 'overlay active';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>Глобальный поиск</h3>
                    <button class="icon-btn modal-close">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    <input type="text" class="global-search-input" placeholder="Поиск по всем чатам..." id="globalSearchInput">
                    <div class="global-search-results" id="globalSearchResults"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const input = modal.querySelector('#globalSearchInput');
        const results = modal.querySelector('#globalSearchResults');
        
        input.addEventListener('input', Helpers.debounce((e) => {
            const query = e.target.value.trim();
            if (query.length < 2) {
                results.innerHTML = '';
                return;
            }
            
            const searchResults = API.searchAllMessages(query);
            results.innerHTML = searchResults.slice(0, 20).map(msg => `
                <div class="search-result-item" data-chat="${msg.chatId}" data-msg="${msg.id}">
                    <div class="search-result-chat">${msg.chatName}</div>
                    <div class="search-result-text">${Helpers.escapeHtml(msg.text.substring(0, 100))}</div>
                    <div class="search-result-time">${msg.time}</div>
                </div>
            `).join('');
            
            results.querySelectorAll('.search-result-item').forEach(item => {
                item.onclick = () => {
                    State.setCurrentChat(item.dataset.chat);
                    modal.remove();
                };
            });
        }, 300));
        
        modal.querySelector('.modal-close').onclick = () => modal.remove();
        input.focus();
    },
    
    exportCurrentChat() {
        if (!State.currentChat) return;
        
        const data = API.exportChat(State.currentChat);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat_${State.currentChat}_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        Helpers.showToast('Чат экспортирован');
    },
    
    showSettings() {
        const modal = document.createElement('div');
        modal.className = 'overlay active';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>Настройки</h3>
                    <button class="icon-btn modal-close">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="settings-section">
                        <h4>Тема</h4>
                        <div class="theme-selector">
                            <button class="theme-btn" data-theme="dark">Тёмная</button>
                            <button class="theme-btn" data-theme="light">Светлая</button>
                            <button class="theme-btn" data-theme="midnight">Полночь</button>
                        </div>
                    </div>
                    <div class="settings-section">
                        <h4>Акцентный цвет</h4>
                        <div class="color-selector">
                            ${['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4']
                                .map(color => `<button class="color-btn" data-color="${color}" style="background: ${color}"></button>`)
                                .join('')}
                        </div>
                    </div>
                    <div class="settings-section">
                        <h4>Данные</h4>
                        <button class="btn btn-primary" id="exportAllData">Экспортировать все данные</button>
                        <button class="btn btn-primary" id="importData">Импортировать данные</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelectorAll('.theme-btn').forEach(btn => {
            btn.onclick = () => {
                State.setTheme(btn.dataset.theme);
                Helpers.showToast('Тема изменена');
            };
        });
        
        modal.querySelectorAll('.color-btn').forEach(btn => {
            btn.onclick = () => {
                State.setAccentColor(btn.dataset.color);
                Helpers.showToast('Цвет изменён');
            };
        });
        
        modal.querySelector('#exportAllData').onclick = () => {
            const data = API.exportAllData();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `cat_messenger_backup_${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            Helpers.showToast('Данные экспортированы');
        };
        
        modal.querySelector('#importData').onclick = () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = (ev) => {
                    if (API.importData(ev.target.result)) {
                        Helpers.showToast('Данные импортированы');
                        location.reload();
                    } else {
                        Helpers.showToast('Ошибка импорта');
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        };
        
        modal.querySelector('.modal-close').onclick = () => modal.remove();
    },
    
    closeAllModals() {
        document.querySelectorAll('.overlay.active').forEach(overlay => {
            overlay.classList.remove('active');
        });
    },
    
    setupVoiceInput() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.lang = 'ru-RU';
            this.recognition.continuous = false;
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                const input = document.getElementById('messageInput');
                if (input) {
                    input.value += transcript;
                    input.dispatchEvent(new Event('input'));
                }
            };
        }
    },
    
    startVoiceInput() {
        if (this.recognition) {
            this.recognition.start();
            Helpers.showToast('Говорите...');
        } else {
            Helpers.showToast('Голосовой ввод не поддерживается');
        }
    },
    
    setupImageCompression() {
        this.maxImageSize = 1024 * 1024;
    },
    
    compressImage(file, maxWidth = 1920, quality = 0.8) {
        return new Promise((resolve) => {
            if (file.size < this.maxImageSize) {
                resolve(file);
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob((blob) => {
                        resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                    }, 'image/jpeg', quality);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    },
    
    setupAutoResponder() {
        this.autoResponderEnabled = localStorage.getItem('cat_auto_responder') === 'true';
        this.autoResponderMessage = localStorage.getItem('cat_auto_responder_message') || 'Я сейчас не могу ответить. Отвечу позже!';
    },
    
    toggleAutoResponder() {
        this.autoResponderEnabled = !this.autoResponderEnabled;
        localStorage.setItem('cat_auto_responder', this.autoResponderEnabled);
        return this.autoResponderEnabled;
    },
    
    setAutoResponderMessage(message) {
        this.autoResponderMessage = message;
        localStorage.setItem('cat_auto_responder_message', message);
    },
    
    getChatStats(chatId) {
        return API.getChatStats(chatId);
    },
    
    showChatStats() {
        if (!State.currentChat) return;
        
        const stats = this.getChatStats(State.currentChat);
        if (!stats) return;
        
        const modal = document.createElement('div');
        modal.className = 'overlay active';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>Статистика чата</h3>
                    <button class="icon-btn modal-close">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-value">${stats.total}</div>
                            <div class="stat-label">Всего сообщений</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${stats.sent}</div>
                            <div class="stat-label">Отправлено</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${stats.received}</div>
                            <div class="stat-label">Получено</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${stats.media}</div>
                            <div class="stat-label">Медиа</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${stats.files}</div>
                            <div class="stat-label">Файлы</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.querySelector('.modal-close').onclick = () => modal.remove();
    }
};
