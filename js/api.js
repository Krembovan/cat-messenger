import { State } from './state.js';

const STORAGE_KEY = 'cat_messenger';

const DEFAULT_CHATS = {
    felix: {
        id: 'felix', name: 'Алексей', status: 'В сети', online: true, 
        pinned: false, muted: false, archived: false, wallpaper: null, unreadCount: 0,
        messages: [
            { id: 1, text: 'Привет! Как дела?', time: '14:20', timestamp: Date.now() - 86400000 * 2, incoming: true, reactions: { '❤️': ['other'] } },
            { id: 2, text: 'Привет! Всё отлично, работаю над новым проектом', time: '14:22', timestamp: Date.now() - 86400000 * 2, incoming: false, status: 'read', reactions: {} },
            { id: 3, text: 'Круто! Может встретимся завтра обсудить?', time: '14:25', timestamp: Date.now() - 86400000, incoming: true, reactions: {} },
            { id: 4, text: 'Да, давай! Во сколько удобно?', time: '14:28', timestamp: Date.now() - 86400000, incoming: false, status: 'read', reactions: {} },
            { id: 5, text: 'Отлично, давай завтра встретимся!', time: '14:32', timestamp: Date.now() - 3600000, incoming: true, reactions: { '👍': ['other', 'you'] } }
        ]
    },
    maria: {
        id: 'maria', name: 'Мария',
        status: 'В сети', online: true, pinned: false, muted: false, 
        archived: false, wallpaper: null, unreadCount: 1,
        messages: [
            { id: 1, text: 'Привет! Как дела с проектом?', time: '12:15', timestamp: Date.now() - 86400000, incoming: true, reactions: {} },
            { id: 2, text: 'Всё по плану, скоро закончу', time: '12:20', timestamp: Date.now() - 86400000, incoming: false, status: 'read', reactions: {} }
        ]
    },
    team: {
        id: 'team', name: 'Рабочий чат',
        status: '5 участников', online: false, pinned: true, muted: false,
        archived: false, wallpaper: null, unreadCount: 0,
        messages: [
            { id: 1, text: 'Документы отправлены', time: '18:45', timestamp: Date.now() - 172800000, incoming: true, sender: 'Иван', reactions: {} },
            { id: 2, text: 'Спасибо, проверю', time: '18:50', timestamp: Date.now() - 172800000, incoming: false, status: 'delivered', reactions: {} }
        ]
    },
    dmitry: {
        id: 'dmitry', name: 'Дмитрий',
        status: 'Был недавно', online: false, pinned: false, muted: false,
        archived: false, wallpaper: null, unreadCount: 0,
        messages: [{ id: 1, text: 'Спасибо за помощь!', time: '10:30', timestamp: Date.now() - 259200000, incoming: true, reactions: {} }]
    },
    anna: {
        id: 'anna', name: 'Анна',
        status: 'В сети', online: true, pinned: false, muted: false,
        archived: false, wallpaper: null, unreadCount: 2,
        messages: [
            { id: 1, text: 'Увидимся на конференции!', time: '09:00', timestamp: Date.now() - 86400000, incoming: true, reactions: {} },
            { id: 2, text: 'Обязательно! Буду рада тебя видеть', time: '09:05', timestamp: Date.now() - 86400000, incoming: false, status: 'read', reactions: {} }
        ]
    },
    peter: {
        id: 'peter', name: 'Пётр',
        status: 'Был давно', online: false, pinned: false, muted: false,
        archived: false, wallpaper: null, unreadCount: 0,
        messages: [{ id: 1, text: 'Фото от 8 марта 📷', time: '14:20', timestamp: Date.now() - 604800000, incoming: true, reactions: {} }]
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
            if (chat.archived === undefined) chat.archived = false;
            if (chat.wallpaper === undefined) chat.wallpaper = null;
            if (chat.unreadCount === undefined) chat.unreadCount = 0;
            
            chat.messages.forEach(msg => {
                if (typeof msg.id !== 'string') msg.id = String(msg.id);
                if (msg.replyTo && typeof msg.replyTo !== 'string') msg.replyTo = String(msg.replyTo);
                if (!msg.timestamp) msg.timestamp = Date.now() - Math.random() * 86400000 * 7;
                if (msg.pinned === undefined) msg.pinned = false;
                if (msg.bookmarked === undefined) msg.bookmarked = false;
                if (msg.voiceAmplitudes === undefined) msg.voiceAmplitudes = null;
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
            timestamp: Date.now(),
            incoming: message.incoming || false,
            status: message.incoming ? null : 'sent',
            sender: message.sender || null,
            replyTo: message.replyTo || null,
            reactions: {},
            type: message.type || 'text',
            voiceDuration: message.voiceDuration || null,
            voiceAmplitudes: message.voiceAmplitudes || null,
            file: message.file || null,
            edited: false,
            forwarded: message.forwarded || false,
            pinned: false,
            bookmarked: false
        };
        chat.messages.push(newMsg);
        this.save();
        State.notify('messageAdded', { chatId, message: newMsg });
        return newMsg;
    },
    
    editMessage(chatId, messageId, newText) {
        const chat = State.chats[chatId];
        if (!chat) return false;
        const msg = chat.messages.find(m => String(m.id) === String(messageId));
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
        const index = chat.messages.findIndex(m => String(m.id) === String(messageId));
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
            const msg = fromChat.messages.find(m => String(m.id) === String(mid));
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
        const msg = chat.messages.find(m => String(m.id) === String(messageId));
        if (!msg) return;
        
        if (!msg.reactions) msg.reactions = {};
        
        const already = Object.keys(msg.reactions).find(e => msg.reactions[e].includes('you'));
        
        if (already === emoji) {
            const idx = msg.reactions[emoji].indexOf('you');
            if (idx > -1) msg.reactions[emoji].splice(idx, 1);
            if (msg.reactions[emoji].length === 0) delete msg.reactions[emoji];
        } else {
            if (already) {
                const idx = msg.reactions[already].indexOf('you');
                if (idx > -1) msg.reactions[already].splice(idx, 1);
                if (msg.reactions[already].length === 0) delete msg.reactions[already];
            }
            if (!msg.reactions[emoji]) msg.reactions[emoji] = [];
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
        const msg = chat.messages.find(m => String(m.id) === String(messageId));
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
    },
    
    toggleArchive(chatId) {
        const chat = State.chats[chatId];
        if (!chat) return;
        chat.archived = !chat.archived;
        this.save();
        State.notify('chatArchived', { chatId, archived: chat.archived });
    },
    
    setWallpaper(chatId, wallpaper) {
        const chat = State.chats[chatId];
        if (!chat) return;
        chat.wallpaper = wallpaper;
        this.save();
        State.notify('wallpaperChanged', { chatId, wallpaper });
    },
    
    markAsRead(chatId) {
        const chat = State.chats[chatId];
        if (!chat) return;
        chat.unreadCount = 0;
        this.save();
        State.notify('chatRead', { chatId });
    },
    
    incrementUnread(chatId) {
        const chat = State.chats[chatId];
        if (!chat) return;
        chat.unreadCount = (chat.unreadCount || 0) + 1;
        this.save();
        State.notify('unreadChanged', { chatId, count: chat.unreadCount });
    },
    
    togglePinMessage(chatId, messageId) {
        const chat = State.chats[chatId];
        if (!chat) return;
        const msg = chat.messages.find(m => String(m.id) === String(messageId));
        if (!msg) return;
        msg.pinned = !msg.pinned;
        this.save();
        State.notify('messagePinned', { chatId, messageId, pinned: msg.pinned });
    },
    
    toggleBookmark(chatId, messageId) {
        const chat = State.chats[chatId];
        if (!chat) return;
        const msg = chat.messages.find(m => String(m.id) === String(messageId));
        if (!msg) return;
        msg.bookmarked = !msg.bookmarked;
        this.save();
        State.notify('messageBookmarked', { chatId, messageId, bookmarked: msg.bookmarked });
    },
    
    getPinnedMessages(chatId) {
        const chat = State.chats[chatId];
        if (!chat) return [];
        return chat.messages.filter(m => m.pinned);
    },
    
    getBookmarkedMessages() {
        const all = [];
        Object.values(State.chats).forEach(chat => {
            chat.messages.filter(m => m.bookmarked).forEach(m => {
                all.push({ ...m, chatId: chat.id, chatName: chat.name });
            });
        });
        return all;
    },
    
    searchMessages(chatId, query) {
        const chat = State.chats[chatId];
        if (!chat) return [];
        const lower = query.toLowerCase();
        return chat.messages.filter(m => 
            m.text && m.text.toLowerCase().includes(lower)
        );
    },
    
    searchAllMessages(query) {
        const results = [];
        const lower = query.toLowerCase();
        Object.values(State.chats).forEach(chat => {
            chat.messages.filter(m => m.text && m.text.toLowerCase().includes(lower))
                .forEach(m => results.push({ ...m, chatId: chat.id, chatName: chat.name }));
        });
        return results;
    },
    
    getMediaMessages(chatId) {
        const chat = State.chats[chatId];
        if (!chat) return [];
        return chat.messages.filter(m => m.type === 'image' || m.type === 'voice');
    },
    
    getFilesMessages(chatId) {
        const chat = State.chats[chatId];
        if (!chat) return [];
        return chat.messages.filter(m => m.type === 'file');
    },
    
    getLinkMessages(chatId) {
        const chat = State.chats[chatId];
        if (!chat) return [];
        const urlRegex = /https?:\/\/[^\s]+/g;
        return chat.messages.filter(m => m.text && urlRegex.test(m.text));
    },
    
    exportChat(chatId) {
        const chat = State.chats[chatId];
        if (!chat) return null;
        return JSON.stringify(chat, null, 2);
    },
    
    exportAllData() {
        return JSON.stringify(State.chats, null, 2);
    },
    
    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            State.chats = data;
            this._normalizeIds();
            this.save();
            State.notify('dataImported');
            return true;
        } catch (e) {
            console.error('Import failed:', e);
            return false;
        }
    },
    
    scheduleMessage(chatId, message, delay) {
        setTimeout(() => {
            this.addMessage(chatId, message);
        }, delay);
    },
    
    getChatStats(chatId) {
        const chat = State.chats[chatId];
        if (!chat) return null;
        const total = chat.messages.length;
        const sent = chat.messages.filter(m => !m.incoming).length;
        const received = total - sent;
        const media = chat.messages.filter(m => m.type === 'image' || m.type === 'voice').length;
        const files = chat.messages.filter(m => m.type === 'file').length;
        return { total, sent, received, media, files };
    },
    
    formatText(text) {
        let formatted = Helpers.escapeHtml(text);
        formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
        formatted = formatted.replace(/~~(.+?)~~/g, '<del>$1</del>');
        formatted = formatted.replace(/`(.+?)`/g, '<code>$1</code>');
        formatted = formatted.replace(/```([\s\S]+?)```/g, '<pre><code>$1</code></pre>');
        formatted = formatted.replace(/__(.+?)__/g, '<u>$1</u>');
        formatted = formatted.replace(/https?:\/\/[^\s]+/g, url => 
            `<a href="${url}" target="_blank" rel="noopener">${url}</a>`
        );
        return formatted;
    }
};
