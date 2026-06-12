import { State } from '../state.js';
import { API } from '../api.js';
import { Helpers } from '../utils/helpers.js';
import { Profile } from './profile.js';
import { Utilities } from './utilities.js';

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
            searchInput: document.getElementById('searchInput'),
            chatContextMenu: document.getElementById('chatContextMenu'),
            resizeHandle: document.getElementById('sidebarResizeHandle')
        };
        
        const savedWidth = localStorage.getItem('cat_sidebar_width');
        if (savedWidth && window.innerWidth >= 768) {
            this.elements.sidebar.style.width = savedWidth + 'px';
        }
    },
    
    bindEvents() {
        this.elements.searchInput.addEventListener('input',
            Helpers.debounce((e) => this.handleSearch(e.target.value), 300)
        );
        
        const hamburger = document.getElementById('hamburgerBtn');
        const dropdown = document.getElementById('hamburgerDropdown');
        const closeBtn = document.getElementById('hamburgerCloseBtn');
        
        if (hamburger && dropdown) {
            hamburger.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('show');
            });
            
            document.addEventListener('click', (e) => {
                if (dropdown.classList.contains('show') && !dropdown.contains(e.target) && e.target !== hamburger) {
                    dropdown.classList.remove('show');
                }
            });
            
            closeBtn?.addEventListener('click', () => dropdown.classList.remove('show'));
            
            dropdown.querySelectorAll('.dropdown-item').forEach(item => {
                item.addEventListener('click', () => {
                    const action = item.dataset.action;
                    dropdown.classList.remove('show');
                    if (action === 'settings') {
                        Utilities.showSettings();
                    } else if (action === 'profile') {
                        if (State.currentChat) {
                            Profile.show(State.currentChat);
                        }
                    }
                });
            });
        }
        
        this.initResize();
        
        document.addEventListener('click', (e) => {
            if (this.elements.chatContextMenu && !this.elements.chatContextMenu.contains(e.target)) {
                this.hideChatContextMenu();
            }
        });
        
        if (this.elements.chatContextMenu) {
            this.elements.chatContextMenu.addEventListener('click', (e) => {
                const item = e.target.closest('.context-item');
                if (!item) return;
                const chatId = this.elements.chatContextMenu._chatId;
                if (!chatId) return;
                const action = item.dataset.action;
                this.handleChatContextAction(action, chatId);
                this.hideChatContextMenu();
            });
        }
    },
    
    bindStateEvents() {
        State.subscribe((event) => {
            if (event === 'chatChanged' || event === 'messageAdded' ||
                event === 'messageDeleted' || event === 'messagesDeleted' ||
                event === 'chatPinned' || event === 'chatMuted' ||
                event === 'chatDeleted' || event === 'historyCleared' ||
                event === 'messagesForwarded' || event === 'chatArchived' ||
                event === 'chatRead' || event === 'unreadChanged' ||
                event === 'customNameChanged' || event === 'customStatusChanged') {
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
        
        const pinnedChats = filteredChats.filter(c => c.pinned);
        const normalChats = filteredChats.filter(c => !c.pinned);
        const dividerHtml = pinnedChats.length > 0 && normalChats.length > 0
            ? '<div class="chat-divider"></div>' : '';
        
        this.elements.chatsList.innerHTML = archiveBtnHtml
            + pinnedChats.map(chat => this.renderChatItem(chat)).join('')
            + dividerHtml
            + normalChats.map(chat => this.renderChatItem(chat)).join('');
        
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
        const displayName = API.getDisplayName(chat.id);
        
        const pinHtml = chat.pinned ? '<span class="pin-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z"/></svg></span>' : '';
        return `
            <div class="chat-item ${isActive ? 'active' : ''}${chat.muted ? ' muted' : ''}${chat.archived ? ' archived' : ''}" data-chat="${chat.id}">
                <div class="chat-avatar">
                    ${Helpers.avatarHtml(displayName || chat.name, 48)}
                    <span class="status ${chat.online ? 'online' : 'offline'}"></span>
                </div>
                <div class="chat-info">
                    <div class="chat-header">
                        <span class="chat-name">${displayName}${pinHtml}</span>
                        <span class="chat-time">${time}</span>
                    </div>
                    <p class="chat-preview">${Helpers.escapeHtml(preview)}</p>
                </div>
                ${unreadBadge}
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
            item.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showChatContextMenu(e, item.dataset.chat);
            });
        });
        
        const archiveBtn = document.getElementById('archiveToggleBtn');
        if (archiveBtn) {
            archiveBtn.addEventListener('click', () => {
                State.toggleArchivedView();
            });
        }
    },
    
    showChatContextMenu(e, chatId) {
        const chat = API.getChat(chatId);
        if (!chat) return;
        
        const menu = this.elements.chatContextMenu;
        if (!menu) return;
        
        menu.querySelectorAll('.context-item').forEach(item => {
            const action = item.dataset.action;
            if (action === 'pin') {
                const span = item.querySelector('span:last-child');
                span.textContent = chat.pinned ? 'Открепить' : 'Закрепить';
            } else if (action === 'mute') {
                const span = item.querySelector('span:last-child');
                span.textContent = chat.muted ? 'Вкл. звук' : 'Без звука';
            }
        });
        
        const rect = menu.getBoundingClientRect();
        const mw = menu.offsetWidth || 160;
        const mh = menu.offsetHeight || 180;
        const left = Math.max(8, Math.min(e.clientX, window.innerWidth - mw - 8));
        const top = Math.max(8, Math.min(e.clientY, window.innerHeight - mh - 8));
        
        menu.style.left = left + 'px';
        menu.style.top = top + 'px';
        menu.classList.add('active');
        menu._chatId = chatId;
    },
    
    hideChatContextMenu() {
        const menu = this.elements.chatContextMenu;
        if (menu) {
            menu.classList.remove('active');
            delete menu._chatId;
        }
    },
    
    handleChatContextAction(action, chatId) {
        switch(action) {
            case 'pin':
                API.togglePin(chatId);
                Helpers.showToast(API.getChat(chatId).pinned ? 'Чат закреплён' : 'Чат откреплён');
                break;
            case 'mute':
                API.toggleMute(chatId);
                Helpers.showToast(API.getChat(chatId).muted ? 'Уведомления выключены' : 'Уведомления включены');
                break;
            case 'archive':
                API.toggleArchive(chatId);
                Helpers.showToast(API.getChat(chatId).archived ? 'Чат архивирован' : 'Чат разархивирован');
                break;
            case 'delete':
                if (confirm('Удалить чат безвозвратно?')) {
                    const wasCurrent = State.currentChat === chatId;
                    API.deleteChat(chatId);
                    if (wasCurrent) {
                        const chats = Object.keys(State.chats);
                        State.setCurrentChat(chats[0] || null);
                    }
                }
                break;
        }
    },
    
    handleSearch(query) {
        this.currentSearch = query;
        this.render();
    },
    
    show() { this.elements.sidebar.classList.remove('hidden'); },
    hide() { this.elements.sidebar.classList.add('hidden'); },

    initResize() {
        const handle = this.elements.resizeHandle;
        if (!handle) return;

        const minWidth = 280;
        const maxWidth = 500;

        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            const startX = e.clientX;
            const startW = this.elements.sidebar.offsetWidth;
            this.elements.sidebar.classList.add('dragging');

            const onMove = (ev) => {
                const w = Math.min(maxWidth, Math.max(minWidth, startW + (ev.clientX - startX)));
                this.elements.sidebar.style.width = w + 'px';
            };

            const onUp = () => {
                this.elements.sidebar.classList.remove('dragging');
                localStorage.setItem('cat_sidebar_width', this.elements.sidebar.offsetWidth);
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            };

            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });
    }
};
