import { State } from '../state.js';

export const Drafts = {
    drafts: {},
    
    init() {
        this.loadDrafts();
        this.bindStateEvents();
    },
    
    loadDrafts() {
        const saved = localStorage.getItem('cat_drafts');
        if (saved) {
            this.drafts = JSON.parse(saved);
        }
    },
    
    saveDrafts() {
        localStorage.setItem('cat_drafts', JSON.stringify(this.drafts));
    },
    
    getDraft(chatId) {
        return this.drafts[chatId] || '';
    },
    
    setDraft(chatId, text) {
        if (text) {
            this.drafts[chatId] = text;
        } else {
            delete this.drafts[chatId];
        }
        this.saveDrafts();
    },
    
    bindStateEvents() {
        State.subscribe((event, data) => {
            if (event === 'chatChanged') {
                const input = document.getElementById('messageInput');
                if (input) {
                    const draft = this.getDraft(data);
                    input.value = draft;
                    input.dispatchEvent(new Event('input'));
                }
            }
        });
    }
};
