import { State } from '../state.js';
import { Chat } from './chat.js';

export const Swipe = {
    startX: 0,
    currentX: 0,
    
    init() {
        this.bindEvents();
    },
    
    bindEvents() {
        const chatMain = document.getElementById('chatMain');
        
        chatMain.addEventListener('touchstart', (e) => {
            this.startX = e.touches[0].clientX;
        }, { passive: true });
        
        chatMain.addEventListener('touchmove', (e) => {
            this.currentX = e.touches[0].clientX;
            const diff = this.currentX - this.startX;
            
            if (diff > 0 && window.innerWidth <= 767) {
                chatMain.style.transform = `translateX(${diff}px)`;
                chatMain.style.transition = 'none';
            }
        }, { passive: true });
        
        chatMain.addEventListener('touchend', () => {
            const diff = this.currentX - this.startX;
            
            chatMain.style.transition = '';
            chatMain.style.transform = '';
            
            if (diff > 80 && window.innerWidth <= 767) {
                Chat.goBack();
            }
            
            this.startX = 0;
            this.currentX = 0;
        });
    }
};
