import { State } from '../state.js';

export const Notifications = {
    audioCtx: null,
    enabled: true,
    browserEnabled: false,

    init() {
        this.enabled = localStorage.getItem('cat_sound') !== 'false';
        this.browserEnabled = localStorage.getItem('cat_browser_notif') === 'true';

        if (this.browserEnabled && 'Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        State.subscribe((event, data) => {
            if (event === 'messageAdded' && data?.message?.incoming) {
                this.onIncomingMessage(data);
            }
        });
    },

    onIncomingMessage(data) {
        const chat = State.chats[data.chatId];
        const msg = data.message;
        const isCurrentChat = data.chatId === State.currentChat;
        const isAtBottom = this.isNearBottom();

        if (this.enabled && (!isCurrentChat || !isAtBottom)) {
            this.playSound();
        }

        if (this.browserEnabled && 'Notification' in window && Notification.permission === 'granted') {
            if (!isCurrentChat || !isAtBottom) {
                this.showBrowserNotification(chat?.name || 'CAT Messenger', msg?.text || '');
            }
        }
    },

    isNearBottom() {
        const container = document.getElementById('messagesContainer');
        if (!container) return true;
        return container.scrollHeight - container.scrollTop - container.clientHeight < 200;
    },

    playSound() {
        try {
            if (!this.audioCtx) {
                this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.frequency.value = 660;
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.15);
            osc.start(this.audioCtx.currentTime);
            osc.stop(this.audioCtx.currentTime + 0.15);
        } catch (e) {}
    },

    showBrowserNotification(title, body) {
        try {
            new Notification(title, {
                body: body.substring(0, 100),
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%233b82f6"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
                tag: 'cat-messenger'
            });
        } catch (e) {}
    },

    toggleSound() {
        this.enabled = !this.enabled;
        localStorage.setItem('cat_sound', this.enabled);
        return this.enabled;
    },

    toggleBrowser() {
        this.browserEnabled = !this.browserEnabled;
        localStorage.setItem('cat_browser_notif', this.browserEnabled);
        if (this.browserEnabled && 'Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
        return this.browserEnabled;
    }
};
