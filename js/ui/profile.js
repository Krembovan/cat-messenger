import { State } from '../state.js';
import { API } from '../api.js';
import { Helpers } from '../utils/helpers.js';

export const Profile = {
    elements: {},
    
    init() {
        this.cacheElements();
        this.bindEvents();
    },
    
    cacheElements() {
        this.elements = {
            overlay: document.getElementById('profileOverlay'),
            backBtn: document.getElementById('profileBackBtn'),
            avatar: document.getElementById('profileAvatar'),
            name: document.getElementById('profileName'),
            status: document.getElementById('profileStatus'),
            callBtn: document.getElementById('profileCallBtn'),
            videoBtn: document.getElementById('profileVideoBtn'),
            searchBtn: document.getElementById('profileSearchBtn'),
            mediaBtn: document.getElementById('profileMediaBtn'),
            filesBtn: document.getElementById('profileFilesBtn'),
            muteBtn: document.getElementById('profileMuteBtn'),
            clearBtn: document.getElementById('profileClearBtn')
        };
    },
    
    bindEvents() {
        this.elements.backBtn.addEventListener('click', () => this.hide());
        this.elements.overlay.addEventListener('click', (e) => {
            if (e.target === this.elements.overlay) this.hide();
        });
        
        this.elements.muteBtn.addEventListener('click', () => {
            API.toggleMute(State.currentChat);
            this.hide();
        });
        
        this.elements.clearBtn.addEventListener('click', () => {
            if (confirm('Очистить историю чата?')) {
                API.clearHistory(State.currentChat);
                this.hide();
            }
        });
        
        this.elements.callBtn.addEventListener('click', () => {
            alert('Голосовой вызов не доступен в этой версии');
        });
        
        this.elements.videoBtn.addEventListener('click', () => {
            alert('Видеозвонок не доступен в этой версии');
        });
        
        this.elements.mediaBtn.addEventListener('click', () => {
            alert('Медиа не доступно в этой версии');
        });
        
        this.elements.filesBtn.addEventListener('click', () => {
            alert('Файлы не доступны в этой версии');
        });
        
        this.elements.searchBtn.addEventListener('click', () => {
            alert('Поиск в чате в разработке');
        });
    },
    
    show(chatId) {
        const chat = API.getChat(chatId);
        if (!chat) return;
        
        this.elements.avatar.style.background = Helpers.nameToColor(chat.name);
        this.elements.avatar.textContent = Helpers.getInitials(chat.name);
        this.elements.name.textContent = chat.name;
        this.elements.status.textContent = chat.status;
        this.elements.status.style.color = chat.online ? 'var(--online)' : 'var(--text-muted)';
        this.elements.muteBtn.querySelector('span').textContent = chat.muted ? '🔈 Вкл. звук' : '🔇 Без звука';
        
        this.elements.overlay.classList.add('active');
    },
    
    hide() {
        this.elements.overlay.classList.remove('active');
    }
};
