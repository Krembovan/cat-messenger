import { State } from '../state.js';
import { API } from '../api.js';
import { Helpers } from '../utils/helpers.js';

export const Sidebar = {
    elements: {},
    
    init() {
        this.cacheElements();
        this.bindEvents();
        this.bindStateEvents();
        this.render();
    },
    
    cacheElements() {
        this.elements = {
            sidebar: document.getElementById('sidebar'),
            chatsList: document.getElementById('chatsList'),
            searchInput: document.getElementById('searchInput')
        };
    },
    
    bindEvents() {
        this.elements.searchInput.addEventListener('input',
            Helpers.debounce((e) => this.handleSearch(e.target.value), 300)
        );
    },
    
    bindStateEvents() {
        State.subscribe((event) => {
            if (event === 'chatChanged' || event === 'messageAdded' ||
                event === 'messageDeleted' || event === 'messagesDeleted' ||
                event === 'chatPinned' || event === 'chatMuted' ||
                event === 'chatDeleted' || event === 'historyCleared' ||
                event === 'messagesForwarded' || event === 'chatArchived' ||
                event === 'chatRead' || event === 'unreadChanged') {
                this.render();
            } else if (event === 'chatClosed') {
                this.show();
            } else if (event === 'archivedViewToggled') {
                this.render();
            }
        });
    },
    
    render() {
        const chats = API.getSortedChats();
        const matchedIds = this.currentSearch
            ? API.searchChats(this.currentSearch)
            : null;
        
        const filteredChats = chats.filter(chat => {
            const matchesSearch = !matchedIds || matchedIds.includes(chat.id);
            const matchesArchive = State.showArchived ? chat.archived : !chat.archived;
            return matchesSearch && matchesArchive;
        });
        
        const archivedCount = chats.filter(c => c.archived).length;
        const archiveBtnHtml = archivedCount > 0 ? `
            <button class="archive-toggle-btn" id="archiveToggleBtn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="21 8 21 21 3 21 3 8"/>
                    <rect x="1" y="3" width="22" height="5"/>
                    <line x1="10" y1="12" x2="14" y2="12"/>
                </svg>
                <span>${State.showArchived ? 'Все чаты' : 'Архив'} (${archivedCount})</span>
            </button>
        ` : '';
        
        this.elements.chatsList.innerHTML = archiveBtnHtml + filteredChats
            .map(chat => this.renderChatItem(chat))
            .join('');
        
        this.bindChatEvents();
    },
    
    renderChatItem(chat) {
        const lastMsg = chat.messages[chat.messages.length - 1];
        const preview = lastMsg
            ? (lastMsg.type === 'voice' ? 'Голосовое сообщение' :
               lastMsg.type === 'image' ? 'Фото' :
               lastMsg.type === 'file' ? (lastMsg.file?.name || 'Файл') :
               (lastMsg.incoming ? '' : 'Вы: ') + lastMsg.text)
            : 'Нет сообщений';
        const time = lastMsg ? lastMsg.time : '';
        const isActive = State.currentChat === chat.id;
        const unreadBadge = chat.unreadCount > 0 ? `<span class="unread-badge">${chat.unreadCount}</span>` : '';
        
        return `
            <div class="chat-item ${isActive ? 'active' : ''}${chat.muted ? ' muted' : ''}${chat.archived ? ' archived' : ''}" data-chat="${chat.id}">
                <div class="chat-avatar">
                    ${Helpers.avatarHtml(chat.name, 48)}
                    <span class="status ${chat.online ? 'online' : 'offline'}"></span>
                </div>
                <div class="chat-info">
                    <div class="chat-header">
                        <span class="chat-name">${chat.name}</span>
                        <span class="chat-time">${time}</span>
                    </div>
                    <p class="chat-preview">${Helpers.escapeHtml(preview)}</p>
                </div>
                ${unreadBadge}
                ${chat.pinned ? '<span class="pin-icon"></span>' : ''}
            </div>
        `;
    },
    
    bindChatEvents() {
        this.elements.chatsList.querySelectorAll('.chat-item').forEach(item => {
            item.addEventListener('click', () => {
                const chatId = item.dataset.chat;
                API.markAsRead(chatId);
                State.setCurrentChat(chatId);
            });
        });
        
        const archiveBtn = document.getElementById('archiveToggleBtn');
        if (archiveBtn) {
            archiveBtn.addEventListener('click', () => {
                State.toggleArchivedView();
            });
        }
    },
    
    handleSearch(query) {
        this.currentSearch = query;
        this.render();
    },
    
    show() { this.elements.sidebar.classList.remove('hidden'); },
    hide() { this.elements.sidebar.classList.add('hidden'); }
};
