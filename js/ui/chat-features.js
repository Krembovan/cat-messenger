import { State } from '../state.js';
import { API } from '../api.js';
import { Helpers } from '../utils/helpers.js';

export const ChatFeatures = {
    init() {
        this.bindEvents();
    },
    
    bindEvents() {
        const input = document.getElementById('messageInput');
        if (input) {
            input.addEventListener('input', (e) => {
                this.handleMentions(e.target);
                this.handleHashtags(e.target);
            });
        }
    },
    
    handleMentions(input) {
        const text = input.value;
        const cursorPos = input.selectionStart;
        const textBeforeCursor = text.substring(0, cursorPos);
        
        const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
        if (mentionMatch) {
            const query = mentionMatch[1].toLowerCase();
            const chats = Object.values(State.chats).filter(c => 
                c.name.toLowerCase().includes(query)
            );
            
            if (chats.length > 0) {
                this.showMentionSuggestions(chats, input, mentionMatch.index);
            }
        } else {
            this.hideMentionSuggestions();
        }
    },
    
    handleHashtags(input) {
        const text = input.value;
        const cursorPos = input.selectionStart;
        const textBeforeCursor = text.substring(0, cursorPos);
        
        const hashtagMatch = textBeforeCursor.match(/#(\w*)$/);
        if (hashtagMatch) {
            this.showHashtagSuggestions(hashtagMatch[1]);
        } else {
            this.hideHashtagSuggestions();
        }
    },
    
    showMentionSuggestions(chats, input, replaceIndex) {
        let suggestions = document.getElementById('mentionSuggestions');
        if (!suggestions) {
            suggestions = document.createElement('div');
            suggestions.id = 'mentionSuggestions';
            suggestions.className = 'mention-suggestions';
            document.body.appendChild(suggestions);
        }
        
        suggestions.innerHTML = chats.slice(0, 5).map(chat => `
            <div class="mention-item" data-name="${chat.name}">
                ${Helpers.avatarHtml(chat.name, 32)}
                <span>${chat.name}</span>
            </div>
        `).join('');
        
        suggestions.style.display = 'block';
        
        suggestions.querySelectorAll('.mention-item').forEach(item => {
            item.onclick = () => {
                const name = item.dataset.name;
                const text = input.value;
                const before = text.substring(0, replaceIndex);
                const after = text.substring(input.selectionStart);
                input.value = before + '@' + name + ' ' + after;
                input.focus();
                this.hideMentionSuggestions();
            };
        });
    },
    
    hideMentionSuggestions() {
        const suggestions = document.getElementById('mentionSuggestions');
        if (suggestions) {
            suggestions.style.display = 'none';
        }
    },
    
    showHashtagSuggestions(query) {
        let suggestions = document.getElementById('hashtagSuggestions');
        if (!suggestions) {
            suggestions = document.createElement('div');
            suggestions.id = 'hashtagSuggestions';
            suggestions.className = 'hashtag-suggestions';
            document.body.appendChild(suggestions);
        }
        
        const commonHashtags = ['важно', 'срочно', 'вопрос', 'идея', 'задача', 'встреча'];
        const filtered = commonHashtags.filter(tag => tag.includes(query.toLowerCase()));
        
        if (filtered.length > 0) {
            suggestions.innerHTML = filtered.map(tag => `
                <div class="hashtag-item" data-tag="${tag}">#${tag}</div>
            `).join('');
            suggestions.style.display = 'block';
        } else {
            suggestions.style.display = 'none';
        }
    },
    
    hideHashtagSuggestions() {
        const suggestions = document.getElementById('hashtagSuggestions');
        if (suggestions) {
            suggestions.style.display = 'none';
        }
    },
    
    createPoll(question, options) {
        if (!State.currentChat) return;
        
        const poll = {
            question,
            options: options.map(opt => ({ text: opt, votes: [] })),
            createdBy: 'you',
            timestamp: Date.now()
        };
        
        API.addMessage(State.currentChat, {
            text: '',
            incoming: false,
            type: 'poll',
            poll: poll
        });
    },
    
    votePoll(messageId, optionIndex) {
        const chat = State.getCurrentChat();
        if (!chat) return;
        
        const msg = chat.messages.find(m => String(m.id) === String(messageId));
        if (!msg || msg.type !== 'poll') return;
        
        msg.poll.options.forEach(opt => {
            opt.votes = opt.votes.filter(v => v !== 'you');
        });
        
        msg.poll.options[optionIndex].votes.push('you');
        API.save();
        State.notify('pollUpdated', { chatId: State.currentChat, messageId });
    },
    
    translateMessage(messageId) {
        const chat = State.getCurrentChat();
        if (!chat) return;
        
        const msg = chat.messages.find(m => String(m.id) === String(messageId));
        if (!msg) return;
        
        Helpers.showToast('Перевод: [функция в разработке]');
    },
    
    createFavoriteChat() {
        const favoriteId = 'favorite';
        if (!State.chats[favoriteId]) {
            State.chats[favoriteId] = {
                id: favoriteId,
                name: 'Избранное',
                status: 'Ваши заметки',
                online: false,
                pinned: true,
                muted: false,
                archived: false,
                wallpaper: null,
                unreadCount: 0,
                isFavorite: true,
                messages: []
            };
            API.save();
        }
    },
    
    setSelfDestructTimer(messageId, delay) {
        setTimeout(() => {
            if (State.currentChat) {
                API.deleteMessage(State.currentChat, messageId);
            }
        }, delay);
    },
    
    createSecretChat(password) {
        const secretId = 'secret_' + Date.now();
        State.chats[secretId] = {
            id: secretId,
            name: 'Секретный чат',
            status: 'Зашифровано',
            online: false,
            pinned: false,
            muted: false,
            archived: false,
            wallpaper: null,
            unreadCount: 0,
            isSecret: true,
            password: password,
            messages: []
        };
        API.save();
        return secretId;
    },
    
    verifySecretChat(chatId, password) {
        const chat = State.chats[chatId];
        return chat && chat.isSecret && chat.password === password;
    }
};
