import { State } from './state.js';
import { API } from './api.js';
import { Sidebar } from './ui/sidebar.js';
import { Chat } from './ui/chat.js';
import { Messages } from './ui/messages.js';
import { Input } from './ui/input.js';
import { Emoji } from './ui/emoji.js';
import { ContextMenu } from './ui/context-menu.js';
import { Swipe } from './ui/swipe.js';
import { Profile } from './ui/profile.js';
import { Modals } from './ui/modals.js';

const App = {
    init() {
        console.log('[CAT] Initializing...');
        
        API.load();
        
        const modules = [Sidebar, Chat, Messages, Input, Emoji, ContextMenu, Swipe, Profile, Modals];
        modules.forEach(m => {
            try { m.init(); } catch (e) { console.error('[CAT] Failed to init module:', e); }
        });
        
        this.bindGlobalEvents();
        
        const chats = Object.keys(State.chats);
        if (chats.length > 0) {
            State.setCurrentChat(chats[0]);
        }
        
        console.log(`[CAT] Ready! ${chats.length} chats loaded.`);
    },
    
    bindGlobalEvents() {
        State.subscribe((event) => {
            if (event === 'chatClosed') Sidebar.show();
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (State.emojiPickerOpen) {
                    State.closeEmojiPicker();
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
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
