import { State } from '../state.js';
import { API } from '../api.js';
import { Chat } from './chat.js';

export const Input = {
    elements: {},
    typingTimeout: null,
    
    init() {
        this.cacheElements();
        this.bindEvents();
        this.bindStateEvents();
    },
    
    cacheElements() {
        this.elements = {
            input: document.getElementById('messageInput'),
            sendBtn: document.getElementById('sendBtn'),
            replyPreview: document.getElementById('replyPreview'),
            replyText: document.getElementById('replyText'),
            replyCancel: document.getElementById('replyCancel')
        };
    },
    
    bindEvents() {
        this.elements.input.addEventListener('input', () => {
            this.autoResize();
            this.handleTyping();
        });
        
        this.elements.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.send();
            }
        });
        
        this.elements.sendBtn.addEventListener('click', () => this.send());
        this.elements.replyCancel.addEventListener('click', () => State.clearReply());
    },
    
    bindStateEvents() {
        State.subscribe((event) => {
            if (event === 'replyChanged') {
                this.showReplyPreview();
            } else if (event === 'replyCleared') {
                this.hideReplyPreview();
            }
        });
    },
    
    send() {
        const text = this.elements.input.value.trim();
        if (!text || !State.currentChat) return;
        
        const message = API.addMessage(State.currentChat, {
            text: text,
            incoming: false,
            replyTo: State.replyToMessageId
        });
        
        State.clearReply();
        this.clear();
        
        this.simulateStatusUpdates(message.id);
        this.simulateReply();
    },
    
    simulateStatusUpdates(messageId) {
        setTimeout(() => {
            API.updateMessageStatus(State.currentChat, messageId, 'delivered');
        }, 1000);
        
        setTimeout(() => {
            API.updateMessageStatus(State.currentChat, messageId, 'read');
        }, 2000);
    },
    
    simulateReply() {
        Chat.showTyping();
        
        setTimeout(() => {
            Chat.hideTyping();
            
            const replies = [
                'Понял, хорошо!',
                'Отличная идея!',
                'Давай обсудим это завтра',
                'Согласен!',
                'Интересно, расскажи подробнее',
                'Ок, принято 👍',
                'Спасибо за информацию!',
                'Буду иметь в виду',
                'Хорошо, жду!',
                'Да, конечно!'
            ];
            
            API.addMessage(State.currentChat, {
                text: replies[Math.floor(Math.random() * replies.length)],
                incoming: true
            });
        }, 2500);
    },
    
    autoResize() {
        this.elements.input.style.height = 'auto';
        this.elements.input.style.height = Math.min(
            this.elements.input.scrollHeight, 
            100
        ) + 'px';
    },
    
    handleTyping() {
        clearTimeout(this.typingTimeout);
        this.elements.input.classList.add('typing');
        this.typingTimeout = setTimeout(() => {
            this.elements.input.classList.remove('typing');
        }, 1000);
    },
    
    showReplyPreview() {
        const chat = State.getCurrentChat();
        const msg = chat?.messages.find(m => m.id === State.replyToMessageId);
        
        if (msg) {
            this.elements.replyText.textContent = msg.text.substring(0, 50) + '...';
            this.elements.replyPreview.classList.add('active');
            this.elements.input.focus();
        }
    },
    
    hideReplyPreview() {
        this.elements.replyPreview.classList.remove('active');
    },
    
    clear() {
        this.elements.input.value = '';
        this.elements.input.style.height = 'auto';
    },
    
    insertEmoji(emoji) {
        this.elements.input.value += emoji;
        this.elements.input.focus();
    }
};
