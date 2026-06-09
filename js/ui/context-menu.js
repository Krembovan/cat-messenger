import { State } from '../state.js';
import { API } from '../api.js';
import { Helpers } from '../utils/helpers.js';

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
    
    show(msgEl) {
        const msgId = String(msgEl.dataset.id);
        this.currentMsgId = msgId;
        
        const editItem = this.elements.menu.querySelector('[data-action="edit"]');
        const chat = State.getCurrentChat();
        const msg = chat?.messages.find(m => String(m.id) === msgId);
        
        if (editItem) {
            editItem.style.display = (msg && !msg.incoming) ? 'flex' : 'none';
        }
        
        this.elements.menu.classList.add('active');
        this.elements.menu.dataset.msgId = msgId;
        
        const rect = msgEl.getBoundingClientRect();
        const mw = this.elements.menu.offsetWidth || 180;
        const mh = this.elements.menu.offsetHeight || 200;
        const x = msg.incoming ? rect.left : rect.right - mw;
        const y = rect.bottom + 4;
        const left = Math.max(8, Math.min(x, window.innerWidth - mw - 8));
        const top = y + mh > window.innerHeight - 8 ? rect.top - mh - 4 : y;
        
        this.elements.menu.style.left = left + 'px';
        this.elements.menu.style.top = top + 'px';
    },
    
    hide() {
        this.elements.menu.classList.remove('active');
        this.currentMsgId = null;
    },
    
    handleAction(action) {
        if (!this.currentMsgId || !State.currentChat) return;
        
        const chat = State.getCurrentChat();
        const msgStrId = String(this.currentMsgId);
        const msgIndex = chat.messages.findIndex(m => String(m.id) === msgStrId);
        if (msgIndex === -1) return;
        
        switch(action) {
            case 'react':
                document.getElementById('reactionPicker')._msgId = this.currentMsgId;
                document.getElementById('reactionPicker').classList.add('active');
                break;
            case 'reply':
                State.setReplyTo(this.currentMsgId);
                break;
            case 'copy':
                navigator.clipboard.writeText(chat.messages[msgIndex].text);
                this.showNotification('Скопировано!');
                break;
            case 'edit':
                State.setEditMessage(this.currentMsgId);
                break;
            case 'forward':
                this.doForward();
                break;
            case 'select':
                State.toggleSelectMode();
                State.toggleMessageSelection(this.currentMsgId);
                break;
            case 'delete':
                API.deleteMessage(State.currentChat, this.currentMsgId);
                break;
        }
    },
    
    doForward() {
        State.selectedMessages = new Set([this.currentMsgId]);
        State.selectMode = false;
        
        const overlay = document.getElementById('forwardOverlay');
        const list = document.getElementById('forwardChats');
        
        const otherChats = Object.values(State.chats).filter(c => c.id !== State.currentChat);
        list.innerHTML = otherChats.map(chat => `
            <div class="contact-item" data-chat="${chat.id}">
                ${Helpers.avatarHtml(chat.name, 40, 'contact-avatar')}
                <span class="contact-name">${chat.name}</span>
            </div>
        `).join('');
        
        list.querySelectorAll('.contact-item').forEach(item => {
            item.addEventListener('click', () => {
                API.forwardMessages(State.currentChat, item.dataset.chat, [this.currentMsgId]);
                overlay.classList.remove('active');
            });
        });
        
        overlay.classList.add('active');
    },
    
    showNotification(text) {
        const notif = document.createElement('div');
        notif.className = 'notification';
        notif.textContent = text;
        document.body.appendChild(notif);
        setTimeout(() => notif.remove(), 2000);
    }
};
