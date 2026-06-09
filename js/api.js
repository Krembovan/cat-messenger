import { State } from './state.js';

const STORAGE_KEY = 'cat_messenger';

const DEFAULT_CHATS = {
    felix: {
        id: 'felix', name: 'Алексей', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        status: 'В сети', online: true, pinned: false, muted: false,
        messages: [
            { id: 1, text: 'Привет! Как дела?', time: '14:20', incoming: true, reactions: { '❤️': ['other'] } },
            { id: 2, text: 'Привет! Всё отлично, работаю над новым проектом', time: '14:22', incoming: false, status: 'read', reactions: {} },
            { id: 3, text: 'Круто! Может встретимся завтра обсудить?', time: '14:25', incoming: true, reactions: {} },
            { id: 4, text: 'Да, давай! Во сколько удобно?', time: '14:28', incoming: false, status: 'read', reactions: {} },
            { id: 5, text: 'Отлично, давай завтра встретимся!', time: '14:32', incoming: true, reactions: { '👍': ['other', 'you'] } }
        ]
    },
    maria: {
        id: 'maria', name: 'Мария', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
        status: 'В сети', online: true, pinned: false, muted: false,
        messages: [
            { id: 1, text: 'Привет! Как дела с проектом?', time: '12:15', incoming: true, reactions: {} },
            { id: 2, text: 'Всё по плану, скоро закончу', time: '12:20', incoming: false, status: 'read', reactions: {} }
        ]
    },
    team: {
        id: 'team', name: 'Рабочий чат', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Team',
        status: '5 участников', online: false, pinned: true, muted: false,
        messages: [
            { id: 1, text: 'Документы отправлены', time: '18:45', incoming: true, sender: 'Иван', reactions: {} },
            { id: 2, text: 'Спасибо, проверю', time: '18:50', incoming: false, status: 'delivered', reactions: {} }
        ]
    },
    dmitry: {
        id: 'dmitry', name: 'Дмитрий', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dmitry',
        status: 'Был недавно', online: false, pinned: false, muted: false,
        messages: [{ id: 1, text: 'Спасибо за помощь!', time: '10:30', incoming: true, reactions: {} }]
    },
    anna: {
        id: 'anna', name: 'Анна', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anna',
        status: 'В сети', online: true, pinned: false, muted: false,
        messages: [
            { id: 1, text: 'Увидимся на конференции!', time: '09:00', incoming: true, reactions: {} },
            { id: 2, text: 'Обязательно! Буду рада тебя видеть', time: '09:05', incoming: false, status: 'read', reactions: {} }
        ]
    },
    peter: {
        id: 'peter', name: 'Пётр', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Peter',
        status: 'Был давно', online: false, pinned: false, muted: false,
        messages: [{ id: 1, text: 'Фото от 8 марта 📷', time: '14:20', incoming: true, reactions: {} }]
    }
};

export const API = {
    load() {
        const saved = localStorage.getItem(STORAGE_KEY);
        State.chats = saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(DEFAULT_CHATS));
        this._normalizeIds();
        if (!saved) this.save();
    },
    
    _normalizeIds() {
        Object.values(State.chats).forEach(chat => {
            chat.messages.forEach(msg => {
                if (typeof msg.id !== 'string') msg.id = String(msg.id);
                if (msg.replyTo && typeof msg.replyTo !== 'string') msg.replyTo = String(msg.replyTo);
            });
        });
    },
    
    save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(State.chats));
    },
    
    getSortedChats() {
        return Object.values(State.chats).sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            const aT = a.messages.length ? a.messages[a.messages.length - 1].time : '';
            const bT = b.messages.length ? b.messages[b.messages.length - 1].time : '';
            return aT === bT ? 0 : aT < bT ? 1 : -1;
        });
    },
    
    getChat(chatId) { return State.chats[chatId]; },
    
    addMessage(chatId, message) {
        const chat = State.chats[chatId];
        if (!chat) return null;
        const newMsg = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 6),
            text: message.text || '',
            time: this.getCurrentTime(),
            incoming: message.incoming || false,
            status: message.incoming ? null : 'sent',
            sender: message.sender || null,
            replyTo: message.replyTo || null,
            reactions: {},
            type: message.type || 'text',
            voiceDuration: message.voiceDuration || null,
            file: message.file || null,
            edited: false
        };
        chat.messages.push(newMsg);
        this.save();
        State.notify('messageAdded', { chatId, message: newMsg });
        return newMsg;
    },
    
    editMessage(chatId, messageId, newText) {
        const chat = State.chats[chatId];
        if (!chat) return false;
        const msg = chat.messages.find(m => m.id === messageId);
        if (!msg) return false;
        msg.text = newText;
        msg.edited = true;
        this.save();
        State.notify('messageEdited', { chatId, messageId, newText });
        return true;
    },
    
    deleteMessage(chatId, messageId) {
        const chat = State.chats[chatId];
        if (!chat) return false;
        const index = chat.messages.findIndex(m => m.id === messageId);
        if (index === -1) return false;
        chat.messages.splice(index, 1);
        this.save();
        State.notify('messageDeleted', { chatId, messageId });
        return true;
    },
    
    deleteMessages(chatId, messageIds) {
        const chat = State.chats[chatId];
        if (!chat) return;
        chat.messages = chat.messages.filter(m => !messageIds.includes(m.id));
        this.save();
        State.notify('messagesDeleted', { chatId, messageIds });
    },
    
    forwardMessages(fromChatId, toChatId, messageIds) {
        const fromChat = State.chats[fromChatId];
        const toChat = State.chats[toChatId];
        if (!fromChat || !toChat) return;
        
        messageIds.forEach(mid => {
            const msg = fromChat.messages.find(m => m.id === mid);
            if (msg) {
                toChat.messages.push({
                    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 6),
                    text: msg.text,
                    time: this.getCurrentTime(),
                    incoming: false,
                    status: 'sent',
                    reactions: {},
                    type: msg.type || 'text',
                    voiceDuration: msg.voiceDuration || null,
                    forwarded: true
                });
            }
        });
        this.save();
        State.notify('messagesForwarded', { fromChatId, toChatId });
    },
    
    toggleReaction(chatId, messageId, emoji) {
        const chat = State.chats[chatId];
        if (!chat) return;
        const msg = chat.messages.find(m => m.id === messageId);
        if (!msg) return;
        
        if (!msg.reactions) msg.reactions = {};
        if (!msg.reactions[emoji]) msg.reactions[emoji] = [];
        
        const idx = msg.reactions[emoji].indexOf('you');
        if (idx > -1) {
            msg.reactions[emoji].splice(idx, 1);
            if (msg.reactions[emoji].length === 0) delete msg.reactions[emoji];
        } else {
            msg.reactions[emoji].push('you');
        }
        
        this.save();
        State.notify('reactionChanged', { chatId, messageId });
    },
    
    togglePin(chatId) {
        const chat = State.chats[chatId];
        if (!chat) return;
        chat.pinned = !chat.pinned;
        this.save();
        State.notify('chatPinned', { chatId, pinned: chat.pinned });
    },
    
    toggleMute(chatId) {
        const chat = State.chats[chatId];
        if (!chat) return;
        chat.muted = !chat.muted;
        this.save();
        State.notify('chatMuted', { chatId, muted: chat.muted });
    },
    
    deleteChat(chatId) {
        delete State.chats[chatId];
        this.save();
        State.notify('chatDeleted', { chatId });
    },
    
    clearHistory(chatId) {
        const chat = State.chats[chatId];
        if (!chat) return;
        chat.messages = [];
        this.save();
        State.notify('historyCleared', { chatId });
    },
    
    updateMessageStatus(chatId, messageId, status) {
        const chat = State.chats[chatId];
        if (!chat) return;
        const msg = chat.messages.find(m => m.id === messageId);
        if (msg) { msg.status = status; this.save(); }
    },
    
    searchChats(query) {
        const lower = query.toLowerCase();
        return Object.values(State.chats).filter(chat =>
            chat.name.toLowerCase().includes(lower) ||
            chat.messages.some(m => m.text.toLowerCase().includes(lower))
        ).map(c => c.id);
    },
    
    getCurrentTime() {
        const now = new Date();
        return now.getHours().toString().padStart(2, '0') + ':' +
               now.getMinutes().toString().padStart(2, '0');
    }
};
