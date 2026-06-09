import { State } from '../state.js';
import { API } from '../api.js';
import { Messages } from './messages.js';
import { Input } from './input.js';

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
            messageCount: document.getElementById('messageCount'),
            typingAvatar: document.getElementById('typingAvatar')
        };
    },
    
    bindEvents() {
        this.elements.backBtn.addEventListener('click', () => this.goBack());
    },
    
    bindStateEvents() {
        State.subscribe((event, data) => {
            if (event === 'chatChanged') {
                this.openChat(data);
            }
        });
    },
    
    openChat(chatId) {
        const chat = API.getChat(chatId);
        if (!chat) return;
        
        this.elements.chatName.textContent = chat.name;
        this.elements.chatAvatar.src = chat.avatar;
        this.elements.chatStatus.textContent = chat.status;
        this.elements.chatStatus.style.color = chat.online 
            ? 'var(--online)' 
            : 'var(--text-muted)';
        this.elements.typingAvatar.src = chat.avatar;
        this.elements.messageCount.textContent = chat.messages.length;
        
        Messages.render();
        Input.clear();
        
        this.show();
    },
    
    show() {
        this.elements.chatMain.classList.add('active');
    },
    
    hide() {
        this.elements.chatMain.classList.remove('active');
    },
    
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
