import { State } from '../state.js';
import { API } from '../api.js';
import { Helpers } from '../utils/helpers.js';

export const AdvancedMessages = {
    undoTimeout: null,
    lastDeletedMessage: null,
    
    init() {
        this.bindStateEvents();
    },
    
    bindStateEvents() {
        State.subscribe((event, data) => {
            if (event === 'messageAdded' && !data.message.incoming) {
                this.showUndoOption(data.chatId, data.message);
            }
        });
    },
    
    showUndoOption(chatId, message) {
        if (this.undoTimeout) clearTimeout(this.undoTimeout);
        
        this.lastDeletedMessage = { chatId, message };
        
        const undoBtn = document.createElement('button');
        undoBtn.className = 'undo-send-btn';
        undoBtn.innerHTML = 'Отменить отправку';
        undoBtn.onclick = () => this.undoSend();
        
        document.body.appendChild(undoBtn);
        
        this.undoTimeout = setTimeout(() => {
            undoBtn.remove();
            this.lastDeletedMessage = null;
        }, 5000);
    },
    
    undoSend() {
        if (!this.lastDeletedMessage) return;
        
        const { chatId, message } = this.lastDeletedMessage;
        API.deleteMessage(chatId, message.id);
        
        const undoBtn = document.querySelector('.undo-send-btn');
        if (undoBtn) undoBtn.remove();
        
        if (this.undoTimeout) clearTimeout(this.undoTimeout);
        this.lastDeletedMessage = null;
        
        Helpers.showToast('Отправка отменена');
    },
    
    scheduleMessage(chatId, text, delay) {
        setTimeout(() => {
            API.addMessage(chatId, {
                text,
                incoming: false
            });
            Helpers.showToast('Запланированное сообщение отправлено');
        }, delay);
    },
    
    sendSilentMessage(chatId, text) {
        API.addMessage(chatId, {
            text,
            incoming: false,
            silent: true
        });
    },
    
    createQuickReply(text) {
        const replies = JSON.parse(localStorage.getItem('cat_quick_replies') || '[]');
        replies.push(text);
        localStorage.setItem('cat_quick_replies', JSON.stringify(replies));
    },
    
    getQuickReplies() {
        return JSON.parse(localStorage.getItem('cat_quick_replies') || '[]');
    },
    
    deleteQuickReply(index) {
        const replies = this.getQuickReplies();
        replies.splice(index, 1);
        localStorage.setItem('cat_quick_replies', JSON.stringify(replies));
    }
};
