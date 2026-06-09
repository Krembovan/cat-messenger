import { State } from '../state.js';
import { API } from '../api.js';
import { Helpers } from '../utils/helpers.js';

export const Sidebar = {
    elements: {},
    
    init() {
        this.cacheElements();
        this.bindEvents();
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
    
    render() {
        const chats = API.getSortedChats();
        const matchedIds = this.currentSearch 
            ? API.searchChats(this.currentSearch) 
            : null;
        
        this.elements.chatsList.innerHTML = chats
            .filter(chat => !matchedIds || matchedIds.includes(chat.id))
            .map(chat => this.renderChatItem(chat))
            .join('');
        
        this.bindChatEvents();
    },
    
    renderChatItem(chat) {
        const lastMsg = chat.messages[chat.messages.length - 1];
        const preview = lastMsg 
            ? (lastMsg.incoming ? '' : 'Вы: ') + lastMsg.text 
            : 'Нет сообщений';
        const time = lastMsg ? lastMsg.time : '';
        const isActive = State.currentChat === chat.id;
        
        return `
            <div class="chat-item ${isActive ? 'active' : ''}" data-chat="${chat.id}">
                <div class="chat-avatar">
                    <img src="${chat.avatar}" alt="${chat.name}">
                    <span class="status ${chat.online ? 'online' : 'offline'}"></span>
                </div>
                <div class="chat-info">
                    <div class="chat-header">
                        <span class="chat-name">${chat.name}</span>
                        <span class="chat-time">${time}</span>
                    </div>
                    <p class="chat-preview">${Helpers.escapeHtml(preview)}</p>
                </div>
                ${chat.pinned ? '<span class="pin-icon">📌</span>' : ''}
            </div>
        `;
    },
    
    bindChatEvents() {
        this.elements.chatsList.querySelectorAll('.chat-item').forEach(item => {
            item.addEventListener('click', () => {
                const chatId = item.dataset.chat;
                State.setCurrentChat(chatId);
            });
        });
    },
    
    handleSearch(query) {
        this.currentSearch = query;
        this.render();
    },
    
    show() {
        this.elements.sidebar.classList.remove('hidden');
    },
    
    hide() {
        this.elements.sidebar.classList.add('hidden');
    }
};
