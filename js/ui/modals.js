import { State } from '../state.js';
import { API } from '../api.js';
import { Helpers } from '../utils/helpers.js';

export const Modals = {
    init() {
        this.initChatSettings();
        this.initNewChat();
        this.initForward();
        this.initAttachments();
        this.initSelectMode();
        this.initReactionPicker();
        this.initImagePreview();
    },
    
    initChatSettings() {
        const overlay = document.getElementById('chatSettingsOverlay');
        const close = document.getElementById('settingsCloseBtn');
        const moreBtn = document.getElementById('chatMoreBtn');
        const pinBtn = document.getElementById('settingsPinBtn');
        const muteBtn = document.getElementById('settingsMuteBtn');
        const clearBtn = document.getElementById('settingsClearBtn');
        const deleteBtn = document.getElementById('settingsDeleteBtn');
        
        moreBtn.addEventListener('click', () => overlay.classList.add('active'));
        close.addEventListener('click', () => overlay.classList.remove('active'));
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.remove('active');
        });
        
        pinBtn.addEventListener('click', () => {
            API.togglePin(State.currentChat);
            overlay.classList.remove('active');
        });
        
        muteBtn.addEventListener('click', () => {
            API.toggleMute(State.currentChat);
            overlay.classList.remove('active');
        });
        
        clearBtn.addEventListener('click', () => {
            if (confirm('Очистить историю чата?')) {
                API.clearHistory(State.currentChat);
                overlay.classList.remove('active');
            }
        });
        
        deleteBtn.addEventListener('click', () => {
            if (confirm('Удалить чат безвозвратно?')) {
                const chatId = State.currentChat;
                API.deleteChat(chatId);
                overlay.classList.remove('active');
                State.setCurrentChat(Object.keys(State.chats)[0] || null);
            }
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
            el.addEventListener('click', () => {
                const msgId = picker._msgId;
                const emoji = el.dataset.emoji;
                API.toggleReaction(State.currentChat, msgId, emoji);
                picker.classList.remove('active');
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
                        text: `📎 ${file.name}`,
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
                <img src="${chat.avatar}" alt="${chat.name}" class="contact-avatar">
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
                <img src="${chat.avatar}" alt="${chat.name}" class="contact-avatar">
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
