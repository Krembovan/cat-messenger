import { State } from '../state.js';
import { API } from '../api.js';

export const ContextMenu = {
    elements: {},
    currentMsgId: null,
    
    init() {
        this.cacheElements();
        this.bindEvents();
    },
    
    cacheElements() {
        this.elements = {
            menu: document.getElementById('contextMenu')
        };
    },
    
    bindEvents() {
        this.elements.menu.querySelectorAll('.context-item').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                this.handleAction(action);
                this.hide();
            });
        });
        
        document.addEventListener('click', (e) => {
            if (!this.elements.menu.contains(e.target)) {
                this.hide();
            }
        });
    },
    
    show(x, y, msgId) {
        this.currentMsgId = msgId;
        
        const maxX = window.innerWidth - 180;
        const maxY = window.innerHeight - 200;
        
        this.elements.menu.style.left = Math.min(x, maxX) + 'px';
        this.elements.menu.style.top = Math.min(y, maxY) + 'px';
        this.elements.menu.classList.add('active');
    },
    
    hide() {
        this.elements.menu.classList.remove('active');
        this.currentMsgId = null;
    },
    
    handleAction(action) {
        if (!this.currentMsgId || !State.currentChat) return;
        
        const chat = State.getCurrentChat();
        const msgIndex = chat.messages.findIndex(m => m.id === this.currentMsgId);
        
        if (msgIndex === -1) return;
        
        switch(action) {
            case 'reply':
                State.setReplyTo(this.currentMsgId);
                break;
                
            case 'copy':
                navigator.clipboard.writeText(chat.messages[msgIndex].text);
                this.showNotification('Скопировано!');
                break;
                
            case 'forward':
                this.showNotification('Пересылка сообщения');
                break;
                
            case 'pin':
                API.togglePin(State.currentChat);
                break;
                
            case 'delete':
                API.deleteMessage(State.currentChat, this.currentMsgId);
                break;
        }
    },
    
    showNotification(text) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = text;
        notification.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--bg-tertiary);
            color: var(--text-primary);
            padding: 12px 24px;
            border-radius: 12px;
            font-size: 14px;
            z-index: 200;
            animation: fadeInOut 2s ease;
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
    }
};
