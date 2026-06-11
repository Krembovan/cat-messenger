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
            clearBtn: document.getElementById('profileClearBtn'),
            nameInput: document.getElementById('profileNameInput'),
            statusInput: document.getElementById('profileStatusInput')
        };
    },
    
    bindEvents() {
        this.elements.backBtn.addEventListener('click', () => this.hide());
        this.elements.overlay.addEventListener('click', (e) => {
            if (e.target === this.elements.overlay) this.hide();
        });
        
        this.elements.muteBtn.addEventListener('click', () => {
            API.toggleMute(State.currentChat);
            this.show(State.currentChat);
        });
        
        this.elements.clearBtn.addEventListener('click', () => {
            if (confirm('Очистить историю чата?')) {
                API.clearHistory(State.currentChat);
                this.hide();
            }
        });
        
        this.elements.nameInput.addEventListener('change', () => {
            API.setCustomName(State.currentChat, this.elements.nameInput.value);
        });
        
        this.elements.statusInput.addEventListener('change', () => {
            API.setCustomStatus(State.currentChat, this.elements.statusInput.value);
        });
        
        this.elements.callBtn.addEventListener('click', () => Helpers.showToast('Звонок не доступен'));
        this.elements.videoBtn.addEventListener('click', () => Helpers.showToast('Видео не доступно'));
        this.elements.mediaBtn.addEventListener('click', () => Helpers.showToast('Медиа не доступно'));
        this.elements.filesBtn.addEventListener('click', () => Helpers.showToast('Файлы не доступны'));
        this.elements.searchBtn.addEventListener('click', () => Helpers.showToast('Поиск в разработке'));
    },
    
    show(chatId) {
        const chat = API.getChat(chatId);
        if (!chat) return;
        
        const displayName = API.getDisplayName(chatId);
        const displayStatus = API.getDisplayStatus(chatId);
        
        this.elements.avatar.style.background = Helpers.nameToColor(chat.name);
        this.elements.avatar.textContent = Helpers.getInitials(displayName);
        this.elements.name.textContent = chat.name;
        this.elements.nameInput.value = chat.customName || '';
        this.elements.status.textContent = displayStatus;
        this.elements.status.style.color = chat.online ? 'var(--online)' : 'var(--text-muted)';
        this.elements.statusInput.value = chat.customStatus || '';
        this.elements.muteBtn.querySelector('span').textContent = chat.muted ? 'Вкл. звук' : 'Без звука';
        
        this.elements.overlay.classList.add('active');
    },
    
    hide() {
        this.elements.overlay.classList.remove('active');
    }
};
