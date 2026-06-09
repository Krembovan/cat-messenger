import { State } from '../state.js';
import { API } from '../api.js';
import { Messages } from './messages.js';
import { Input } from './input.js';
import { Profile } from './profile.js';

export const Chat = {
    elements: {},
    
    init() {
        this.cacheElements();
        this.bindEvents();
        this.bindStateEvents();
    },
    
    cacheElements() {
        this.elements = {
            chatMain: document.getElementById('chatMain'),
            backBtn: document.getElementById('backBtn'),
            chatAvatar: document.getElementById('chatAvatar'),
            chatName: document.getElementById('chatName'),
            chatStatus: document.getElementById('chatStatus'),
            typingAvatar: document.getElementById('typingAvatar'),
            chatUserInfo: document.getElementById('chatUserInfo'),
            chatSearchBtn: document.getElementById('chatSearchBtn')
        };
    },
    
    bindEvents() {
        this.elements.backBtn.addEventListener('click', () => this.goBack());
        this.elements.chatUserInfo.addEventListener('click', () => {
            if (State.currentChat) Profile.show(State.currentChat);
        });
        this.elements.chatSearchBtn.addEventListener('click', () => {
            alert('Поиск в чате в разработке');
        });
    },
    
    bindStateEvents() {
        State.subscribe((event, data) => {
            if (event === 'chatChanged') this.openChat(data);
        });
    },
    
    openChat(chatId) {
        const chat = API.getChat(chatId);
        if (!chat) return;
        
        this.elements.chatName.textContent = chat.name;
        this.elements.chatAvatar.src = chat.avatar;
        this.elements.chatStatus.textContent = chat.status;
        this.elements.chatStatus.style.color = chat.online
            ? 'var(--online)' : 'var(--text-muted)';
        this.elements.typingAvatar.src = chat.avatar;
        
        Messages.render();
        Input.clear();
        
        this.show();
    },
    
    show() { this.elements.chatMain.classList.add('active'); },
    hide() { this.elements.chatMain.classList.remove('active'); },
    
    goBack() {
        this.hide();
        State.notify('chatClosed');
    },
    
    showTyping() {
        document.getElementById('typingIndicator').classList.add('active');
    },
    
    hideTyping() {
        document.getElementById('typingIndicator').classList.remove('active');
    }
};
