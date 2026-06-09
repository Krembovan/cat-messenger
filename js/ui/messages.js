import { State } from '../state.js';
import { API } from '../api.js';
import { Helpers } from '../utils/helpers.js';
import { ContextMenu } from './context-menu.js';

export const Messages = {
    elements: {},
    
    init() {
        this.cacheElements();
        this.bindEvents();
        this.bindStateEvents();
    },
    
    cacheElements() {
        this.elements = {
            container: document.getElementById('messagesContainer')
        };
    },
    
    bindEvents() {
        this.elements.container.addEventListener('contextmenu', (e) => {
            const msgEl = e.target.closest('.message');
            if (!msgEl) return;
            
            e.preventDefault();
            const msgId = parseInt(msgEl.dataset.id);
            const chat = State.getCurrentChat();
            const msg = chat?.messages.find(m => m.id === msgId);
            
            if (msg && !msg.incoming) {
                ContextMenu.show(e.clientX, e.clientY, msgId);
            }
        });
        
        let longPressTimer;
        this.elements.container.addEventListener('touchstart', (e) => {
            const msgEl = e.target.closest('.message');
            if (!msgEl) return;
            
            longPressTimer = setTimeout(() => {
                const msgId = parseInt(msgEl.dataset.id);
                const chat = State.getCurrentChat();
                const msg = chat?.messages.find(m => m.id === msgId);
                
                if (msg && !msg.incoming) {
                    ContextMenu.show(
                        e.touches[0].clientX, 
                        e.touches[0].clientY, 
                        msgId
                    );
                }
            }, 500);
        }, { passive: true });
        
        this.elements.container.addEventListener('touchend', () => {
            clearTimeout(longPressTimer);
        });
    },
    
    bindStateEvents() {
        State.subscribe((event, data) => {
            if (event === 'chatChanged' || event === 'messageAdded' || event === 'messageDeleted') {
                this.render();
            }
        });
    },
    
    render() {
        const chat = State.getCurrentChat();
        if (!chat) return;
        
        this.elements.container.innerHTML = chat.messages
            .map(msg => this.renderMessage(msg, chat))
            .join('');
        
        this.scrollToBottom();
    },
    
    renderMessage(msg, chat) {
        const direction = msg.incoming ? 'incoming' : 'outgoing';
        const avatarHtml = msg.incoming 
            ? `<img src="${chat.avatar}" alt="Avatar" class="message-avatar">` 
            : '';
        const senderHtml = msg.sender 
            ? `<span class="message-sender">${Helpers.escapeHtml(msg.sender)}</span>` 
            : '';
        const statusHtml = !msg.incoming ? this.getStatusIcon(msg.status) : '';
        const replyHtml = msg.replyTo ? this.renderReply(msg.replyTo, chat) : '';
        
        return `
            <div class="message ${direction}" data-id="${msg.id}">
                ${avatarHtml}
                <div class="message-content">
                    ${senderHtml}
                    ${replyHtml}
                    <div class="message-bubble">
                        <p>${Helpers.escapeHtml(msg.text)}</p>
                    </div>
                    <div class="message-meta">
                        <span class="message-time">${msg.time}</span>
                        ${statusHtml}
                    </div>
                </div>
            </div>
        `;
    },
    
    renderReply(replyToId, chat) {
        const replyMsg = chat.messages.find(m => m.id === replyToId);
        if (!replyMsg) return '';
        
        const text = replyMsg.text.substring(0, 50) + (replyMsg.text.length > 50 ? '...' : '');
        return `<div class="message-reply">${Helpers.escapeHtml(text)}</div>`;
    },
    
    getStatusIcon(status) {
        const icons = {
            sent: '<svg class="message-status" viewBox="0 0 16 16"><path d="M3 8l3 3 7-7" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
            delivered: '<svg class="message-status" viewBox="0 0 16 16"><path d="M1 8l3 3 7-7M5 8l3 3 7-7" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
            read: '<svg class="message-status read" viewBox="0 0 16 16"><path d="M1 8l3 3 7-7M5 8l3 3 7-7" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>'
        };
        return icons[status] || '';
    },
    
    scrollToBottom() {
        this.elements.container.scrollTop = this.elements.container.scrollHeight;
    }
};
