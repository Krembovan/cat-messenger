import { State } from './state.js';
import { API } from './api.js';
import { Sidebar } from './ui/sidebar.js';
import { Chat } from './ui/chat.js';
import { Messages } from './ui/messages.js';
import { Input } from './ui/input.js';
import { Emoji } from './ui/emoji.js';
import { Stickers } from './ui/stickers.js';
import { Drafts } from './ui/drafts.js';
import { AdvancedMessages } from './ui/advanced-messages.js';
import { Themes } from './ui/themes.js';
import { GroupChats } from './ui/group-chats.js';
import { MediaGallery } from './ui/media-gallery.js';
import { ChatFeatures } from './ui/chat-features.js';
import { Utilities } from './ui/utilities.js';
import { ContextMenu } from './ui/context-menu.js';
import { Swipe } from './ui/swipe.js';
import { Profile } from './ui/profile.js';
import { Modals } from './ui/modals.js';
import { Notifications } from './ui/notifications.js';

const App = {
    init() {
        console.log('[CAT] Initializing...');
        
        State.loadPreferences();
        API.load();
        
        const modules = [Sidebar, Chat, Messages, Input, Emoji, Stickers, Drafts, AdvancedMessages, Themes, GroupChats, MediaGallery, ChatFeatures, Utilities, ContextMenu, Swipe, Profile, Modals, Notifications];
        modules.forEach(m => {
            try { m.init(); } catch (e) { console.error('[CAT] Failed to init module:', e); }
        });
        
        this.bindGlobalEvents();
        this.registerServiceWorker();
        
        const chats = Object.keys(State.chats);
        if (chats.length > 0) {
            State.setCurrentChat(chats[0]);
        }
        
        console.log(`[CAT] Ready! ${chats.length} chats loaded.`);
    },
    
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(reg => console.log('[CAT] Service Worker registered'))
                .catch(err => console.error('[CAT] Service Worker failed:', err));
        }
    },
    
    bindGlobalEvents() {
        State.subscribe((event) => {
            if (event === 'chatClosed') Sidebar.show();
        });
        
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.icon-btn, .context-item, .panel-item, .profile-menu-item, .profile-action, .chat-item, .send-btn, .voice-btn');
            if (btn) {
                const ripple = document.createElement('span');
                ripple.className = 'ripple';
                const rect = btn.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';
                btn.appendChild(ripple);
                setTimeout(() => ripple.remove(), 500);
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (State.emojiPickerOpen) {
                    State.closeEmojiPicker();
                } else if (State.stickerPickerOpen) {
                    State.closeStickerPicker();
                } else if (State.selectMode) {
                    State.clearSelection();
                } else if (State.currentChat && window.innerWidth <= 767) {
                    Chat.goBack();
                }
                document.getElementById('chatSettingsOverlay').classList.remove('active');
                document.getElementById('profileOverlay').classList.remove('active');
                document.getElementById('newChatOverlay').classList.remove('active');
                document.getElementById('forwardOverlay').classList.remove('active');
            }
        });
        
        const compactBtn = document.getElementById('compactModeBtn');
        if (compactBtn) {
            compactBtn.addEventListener('click', () => {
                const enabled = !State.compactMode;
                State.setCompactMode(enabled);
                compactBtn.style.color = enabled ? 'var(--accent)' : 'var(--text-secondary)';
            });
            if (State.compactMode) compactBtn.style.color = 'var(--accent)';
        }
        
        const stickerBtn = document.getElementById('stickerBtn');
        if (stickerBtn) {
            stickerBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (State.emojiPickerOpen) State.closeEmojiPicker();
                State.toggleStickerPicker();
            });
        }
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
