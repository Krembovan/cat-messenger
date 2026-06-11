import { State } from '../state.js';
import { API } from '../api.js';
import { Helpers } from '../utils/helpers.js';
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
            State.toggleChatSearch();
            const panel = document.getElementById('chatSearchPanel');
            const input = document.getElementById('chatSearchInput');
            if (State.chatSearchOpen) {
                panel.classList.add('active');
                input.focus();
            } else {
                panel.classList.remove('active');
                State.setChatSearch('');
            }
        });
        
        const chatSearchInput = document.getElementById('chatSearchInput');
        const chatSearchClose = document.getElementById('chatSearchClose');
        
        chatSearchInput.addEventListener('input', Helpers.debounce((e) => {
            State.setChatSearch(e.target.value);
        }, 300));
        
        chatSearchClose.addEventListener('click', () => {
            State.chatSearchOpen = false;
            State.setChatSearch('');
            document.getElementById('chatSearchPanel').classList.remove('active');
        });
    },
    
    bindStateEvents() {
        State.subscribe((event, data) => {
            if (event === 'chatChanged') this.openChat(data);
            else if ((event === 'customNameChanged' || event === 'customStatusChanged') && data.chatId === State.currentChat) {
                this.openChat(data.chatId);
            }
        });
    },
    
    openChat(chatId) {
        const chat = API.getChat(chatId);
        if (!chat) return;
        
        this.elements.chatName.textContent = API.getDisplayName(chatId);
        const ca = this.elements.chatAvatar;
        ca.style.background = Helpers.nameToColor(chat.name);
        ca.textContent = Helpers.getInitials(API.getDisplayName(chatId));
        this.elements.chatStatus.textContent = API.getDisplayStatus(chatId);
        this.elements.chatStatus.style.color = chat.online
            ? 'var(--online)' : 'var(--text-muted)';
        const ta = this.elements.typingAvatar;
        ta.style.background = Helpers.nameToColor(chat.name);
        ta.textContent = Helpers.getInitials(API.getDisplayName(chatId));
        
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
