import { State } from './state.js';

const STORAGE_KEY = 'cat_messenger';

const DEFAULT_CHATS = {
    felix: {
        id: 'felix',
        name: 'Алексей',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        status: 'В сети',
        online: true,
        pinned: false,
        messages: [
            { id: 1, text: 'Привет! Как дела?', time: '14:20', incoming: true },
            { id: 2, text: 'Привет! Всё отлично, работаю над новым проектом', time: '14:22', incoming: false, status: 'read' },
            { id: 3, text: 'Круто! Может встретимся завтра обсудить?', time: '14:25', incoming: true },
            { id: 4, text: 'Да, давай! Во сколько удобно?', time: '14:28', incoming: false, status: 'read' },
            { id: 5, text: 'Отлично, давай завтра встретимся!', time: '14:32', incoming: true }
        ]
    },
    maria: {
        id: 'maria',
        name: 'Мария',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
        status: 'В сети',
        online: true,
        pinned: false,
        messages: [
            { id: 1, text: 'Привет! Как дела с проектом?', time: '12:15', incoming: true },
            { id: 2, text: 'Всё по плану, скоро закончу', time: '12:20', incoming: false, status: 'read' }
        ]
    },
    team: {
        id: 'team',
        name: 'Рабочий чат',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Team',
        status: '5 участников',
        online: false,
        pinned: true,
        messages: [
            { id: 1, text: 'Документы отправлены', time: '18:45', incoming: true, sender: 'Иван' },
            { id: 2, text: 'Спасибо, проверю', time: '18:50', incoming: false, status: 'delivered' }
        ]
    },
    dmitry: {
        id: 'dmitry',
        name: 'Дмитрий',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dmitry',
        status: 'Был недавно',
        online: false,
        pinned: false,
        messages: [
            { id: 1, text: 'Спасибо за помощь!', time: '10:30', incoming: true }
        ]
    },
    anna: {
        id: 'anna',
        name: 'Анна',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anna',
        status: 'В сети',
        online: true,
        pinned: false,
        messages: [
            { id: 1, text: 'Увидимся на конференции!', time: '09:00', incoming: true },
            { id: 2, text: 'Обязательно! Буду рада тебя видеть', time: '09:05', incoming: false, status: 'read' }
        ]
    },
    peter: {
        id: 'peter',
        name: 'Пётр',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Peter',
        status: 'Был давно',
        online: false,
        pinned: false,
        messages: [
            { id: 1, text: 'Фото от 8 марта 📷', time: '14:20', incoming: true }
        ]
    }
};

export const API = {
    load() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            State.chats = JSON.parse(saved);
        } else {
            State.chats = JSON.parse(JSON.stringify(DEFAULT_CHATS));
            this.save();
        }
    },
    
    save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(State.chats));
    },
    
    getSortedChats() {
        return Object.values(State.chats).sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            const aTime = a.messages.length ? a.messages[a.messages.length - 1].time : '';
            const bTime = b.messages.length ? b.messages[b.messages.length - 1].time : '';
            return bTime.localeCompare(aTime);
        });
    },
    
    getChat(chatId) {
        return State.chats[chatId];
    },
    
    addMessage(chatId, message) {
        const chat = State.chats[chatId];
        if (!chat) return null;
        
        const newMsg = {
            id: Date.now(),
            text: message.text,
            time: this.getCurrentTime(),
            incoming: message.incoming || false,
            status: message.incoming ? null : 'sent',
            sender: message.sender || null,
            replyTo: message.replyTo || null
        };
        
        chat.messages.push(newMsg);
        this.save();
        State.notify('messageAdded', { chatId, message: newMsg });
        return newMsg;
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
    
    togglePin(chatId) {
        const chat = State.chats[chatId];
        if (!chat) return;
        
        chat.pinned = !chat.pinned;
        this.save();
        State.notify('chatPinned', { chatId, pinned: chat.pinned });
    },
    
    updateMessageStatus(chatId, messageId, status) {
        const chat = State.chats[chatId];
        if (!chat) return;
        
        const msg = chat.messages.find(m => m.id === messageId);
        if (msg) {
            msg.status = status;
            this.save();
            State.notify('messageStatusUpdated', { chatId, messageId, status });
        }
    },
    
    searchChats(query) {
        const lower = query.toLowerCase();
        return Object.values(State.chats).filter(chat => {
            const nameMatch = chat.name.toLowerCase().includes(lower);
            const msgMatch = chat.messages.some(m => 
                m.text.toLowerCase().includes(lower)
            );
            return nameMatch || msgMatch;
        }).map(c => c.id);
    },
    
    getCurrentTime() {
        const now = new Date();
        return now.getHours().toString().padStart(2, '0') + ':' +
               now.getMinutes().toString().padStart(2, '0');
    }
};
