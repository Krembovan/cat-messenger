import { State } from '../state.js';
import { API } from '../api.js';
import { Helpers } from '../utils/helpers.js';

export const Modals = {
    init() {
        this.initHeaderDropdown();
        this.initChatSettings();
        this.initNewChat();
        this.initForward();
        this.initAttachments();
        this.initSelectMode();
        this.initReactionPicker();
        this.initImagePreview();
    },
    
    initHeaderDropdown() {
        const dropdown = document.getElementById('headerDropdown');
        const moreBtn = document.getElementById('chatMoreBtn');
        if (!dropdown || !moreBtn) return;
        
        moreBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
            const chat = API.getChat(State.currentChat);
            if (chat) {
                const pinItem = dropdown.querySelector('[data-action="pin"] span:last-child');
                const muteItem = dropdown.querySelector('[data-action="mute"] span:last-child');
                if (pinItem) pinItem.textContent = chat.pinned ? 'Открепить чат' : 'Закрепить чат';
                if (muteItem) muteItem.textContent = chat.muted ? 'Включить уведомления' : 'Выключить уведомления';
            }
        });
        
        document.addEventListener('click', (e) => {
            if (dropdown.classList.contains('show') && !dropdown.contains(e.target) && e.target !== moreBtn) {
                dropdown.classList.remove('show');
            }
        });
        
        dropdown.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                dropdown.classList.remove('show');
                
                if (action === 'pin') API.togglePin(State.currentChat);
                else if (action === 'mute') API.toggleMute(State.currentChat);
                else if (action === 'wallpaper') this.showWallpaperPicker();
                else if (action === 'select') State.toggleSelectMode();
                else if (action === 'clear') {
                    if (confirm('Очистить историю чата?')) API.clearHistory(State.currentChat);
                }
                else if (action === 'delete') {
                    if (confirm('Удалить чат безвозвратно?')) {
                        const chatId = State.currentChat;
                        API.deleteChat(chatId);
                        State.setCurrentChat(Object.keys(State.chats)[0] || null);
                    }
                }
            });
        });
    },
    
    initChatSettings() {
        const overlay = document.getElementById('chatSettingsOverlay');
        const close = document.getElementById('settingsCloseBtn');
        const pinBtn = document.getElementById('settingsPinBtn');
        const muteBtn = document.getElementById('settingsMuteBtn');
        const wallpaperBtn = document.getElementById('settingsWallpaperBtn');
        const clearBtn = document.getElementById('settingsClearBtn');
        const deleteBtn = document.getElementById('settingsDeleteBtn');
        
        if (close) close.addEventListener('click', () => overlay.classList.remove('active'));
        if (overlay) overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.remove('active');
        });
        
        if (pinBtn) pinBtn.addEventListener('click', () => { API.togglePin(State.currentChat); overlay.classList.remove('active'); });
        if (muteBtn) muteBtn.addEventListener('click', () => { API.toggleMute(State.currentChat); overlay.classList.remove('active'); });
        if (wallpaperBtn) wallpaperBtn.addEventListener('click', () => { overlay.classList.remove('active'); this.showWallpaperPicker(); });
        if (clearBtn) clearBtn.addEventListener('click', () => {
            if (confirm('Очистить историю чата?')) { API.clearHistory(State.currentChat); overlay.classList.remove('active'); }
        });
        if (deleteBtn) deleteBtn.addEventListener('click', () => {
            if (confirm('Удалить чат безвозвратно?')) {
                const chatId = State.currentChat;
                API.deleteChat(chatId);
                overlay.classList.remove('active');
                State.setCurrentChat(Object.keys(State.chats)[0] || null);
            }
        });
    },
    
    showWallpaperPicker() {
        const wallpapers = [
            null,
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
            'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
        ];
        
        const html = `
            <div class="wallpaper-picker">
                <h3>Выберите обои</h3>
                <div class="wallpaper-grid">
                    ${wallpapers.map((wp, i) => `
                        <div class="wallpaper-option ${i === 0 ? 'default' : ''}" 
                             data-wallpaper="${wp || ''}"
                             style="${wp ? `background: ${wp}` : ''}">
                            ${i === 0 ? '<span>По умолчанию</span>' : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        const modal = document.createElement('div');
        modal.className = 'overlay active';
        modal.innerHTML = `<div class="modal">${html}</div>`;
        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        modal.querySelectorAll('.wallpaper-option').forEach(opt => {
            opt.addEventListener('click', () => {
                const wp = opt.dataset.wallpaper || null;
                API.setWallpaper(State.currentChat, wp);
                modal.remove();
                Helpers.showToast('Обои обновлены');
            });
        });
    },
    
    initNewChat() {
        const overlay = document.getElementById('newChatOverlay');
        const close = document.getElementById('newChatCloseBtn');
        const btn = document.getElementById('newChatBtn');
        const input = document.getElementById('newChatInput');
        const list = document.getElementById('newChatContacts');
        
        btn.addEventListener('click', () => {
            overlay.classList.add('active');
            this.renderContacts(list, '');
        });
        
        close.addEventListener('click', () => overlay.classList.remove('active'));
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.remove('active');
        });
        
        input.addEventListener('input', Helpers.debounce((e) => {
            this.renderContacts(list, e.target.value);
        }, 300));
    },
    
    initForward() {
        const overlay = document.getElementById('forwardOverlay');
        const close = document.getElementById('forwardCloseBtn');
        const list = document.getElementById('forwardChats');
        const searchInput = document.getElementById('forwardSearchInput');
        
        close.addEventListener('click', () => {
            overlay.classList.remove('active');
            State.clearSelection();
        });
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
                State.clearSelection();
            }
        });
        
        searchInput.addEventListener('input', Helpers.debounce((e) => {
            this.renderForwardChats(list, e.target.value);
        }, 300));
        
        State.subscribe((event) => {
            if (event === 'chatChanged') {
                overlay.classList.remove('active');
                State.clearSelection();
            }
        });
        
        this.renderForwardChats(list, '');
    },
    
    initSelectMode() {
        const cancelBtn = document.getElementById('selectCancelBtn');
        const fwdBtn = document.getElementById('selectFwdBtn');
        const delBtn = document.getElementById('selectDelBtn');
        
        cancelBtn.addEventListener('click', () => State.clearSelection());
        
        fwdBtn.addEventListener('click', () => {
            if (State.selectedMessages.size === 0) return;
            const overlay = document.getElementById('forwardOverlay');
            const list = document.getElementById('forwardChats');
            overlay.classList.add('active');
            this.renderForwardChats(list, '');
        });
        
        delBtn.addEventListener('click', () => {
            const count = State.selectedMessages.size;
            if (count === 0) return;
            if (confirm(`Удалить ${count} сообщений?`)) {
                API.deleteMessages(State.currentChat, Array.from(State.selectedMessages));
                State.clearSelection();
            }
        });
    },
    
    initReactionPicker() {
        const picker = document.getElementById('reactionPicker');
        
        picker.querySelectorAll('.react').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                const msgId = picker._msgId;
                const emoji = el.dataset.emoji;
                if (!msgId || !emoji) return;
                API.toggleReaction(State.currentChat, msgId, emoji);
                picker.classList.remove('active');
                delete picker._msgId;
            });
        });
    },
    
    initAttachments() {
        const attachBtn = document.getElementById('attachBtn');
        const fileInput = document.getElementById('fileInput');
        
        attachBtn.addEventListener('click', () => fileInput.click());
        
        fileInput.addEventListener('change', (e) => {
            const files = e.target.files;
            if (!files.length) return;
            
            Array.from(files).forEach(file => {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        API.addMessage(State.currentChat, {
                            text: '',
                            incoming: false,
                            type: 'image',
                            file: { name: file.name, url: ev.target.result, type: file.type }
                        });
                    };
                    reader.readAsDataURL(file);
                } else {
                    API.addMessage(State.currentChat, {
                        text: file.name,
                        incoming: false,
                        type: 'file',
                        file: { name: file.name, size: file.size, type: file.type }
                    });
                }
            });
            
            fileInput.value = '';
        });
    },
    
    initImagePreview() {
        const overlay = document.getElementById('imageOverlay');
        const img = document.getElementById('imagePreview');
        const close = document.getElementById('imageCloseBtn');
        
        close.addEventListener('click', () => overlay.classList.remove('active'));
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.remove('active');
        });
    },
    
    renderContacts(list, query) {
        const allChats = Object.values(State.chats);
        const filtered = query ? allChats.filter(c => 
            c.name.toLowerCase().includes(query.toLowerCase())
        ) : allChats;
        
        list.innerHTML = filtered.map(chat => `
            <div class="contact-item" data-chat="${chat.id}">
                ${Helpers.avatarHtml(chat.name, 40, 'contact-avatar')}
                <span class="contact-name">${chat.name}</span>
            </div>
        `).join('');
        
        list.querySelectorAll('.contact-item').forEach(item => {
            item.addEventListener('click', () => {
                const chatId = item.dataset.chat;
                document.getElementById('newChatOverlay').classList.remove('active');
                State.setCurrentChat(chatId);
            });
        });
    },
    
    renderForwardChats(list, query) {
        const otherChats = Object.values(State.chats).filter(c => c.id !== State.currentChat);
        const filtered = query
            ? otherChats.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
            : otherChats;
        
        list.innerHTML = filtered.map(chat => `
            <div class="contact-item" data-chat="${chat.id}">
                ${Helpers.avatarHtml(chat.name, 40, 'contact-avatar')}
                <span class="contact-name">${chat.name}</span>
            </div>
        `).join('');
        
        list.querySelectorAll('.contact-item').forEach(item => {
            item.addEventListener('click', () => {
                const toChatId = item.dataset.chat;
                API.forwardMessages(State.currentChat, toChatId, 
                    Array.from(State.selectedMessages));
                
                document.getElementById('forwardOverlay').classList.remove('active');
                State.clearSelection();
            });
        });
    }
};
