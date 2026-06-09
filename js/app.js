import { State } from './state.js';
import { API } from './api.js';
import { Sidebar } from './ui/sidebar.js';
import { Chat } from './ui/chat.js';
import { Messages } from './ui/messages.js';
import { Input } from './ui/input.js';
import { Emoji } from './ui/emoji.js';
import { ContextMenu } from './ui/context-menu.js';
import { Swipe } from './ui/swipe.js';

const App = {
    init() {
        console.log('CAT Messenger initializing...');
        
        API.load();
        
        Sidebar.init();
        Chat.init();
        Messages.init();
        Input.init();
        Emoji.init();
        ContextMenu.init();
        Swipe.init();
        
        this.bindGlobalEvents();
        
        State.setCurrentChat('felix');
        
        console.log('CAT Messenger ready!');
    },
    
    bindGlobalEvents() {
        State.subscribe((event) => {
            if (event === 'chatClosed') {
                Sidebar.show();
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (State.emojiPickerOpen) {
                    State.closeEmojiPicker();
                } else if (State.currentChat && window.innerWidth <= 767) {
                    Chat.goBack();
                }
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
