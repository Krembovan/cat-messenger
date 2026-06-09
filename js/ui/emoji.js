import { State } from '../state.js';
import { Input } from './input.js';

const EMOJIS = [
    '😀', '😂', '😍', '🥰', '😎', '🤔', '😢', '😤',
    '👍', '👎', '❤️', '🔥', '✨', '🎉', '💯', '🙏',
    '💪', '🤝', '👋', '✌️', '🤙', '👀', '💬', '🗯️',
    '✅', '❌', '⭐', '🎊', '🎯', '📌', '📎', '✉️',
    '🗑️', '📁', '📷', '🎵', '🎤', '🎬', '📹', '💻'
];

export const Emoji = {
    elements: {},
    
    init() {
        this.cacheElements();
        this.render();
        this.bindEvents();
        this.bindStateEvents();
    },
    
    cacheElements() {
        this.elements = {
            btn: document.getElementById('emojiBtn'),
            picker: document.getElementById('emojiPicker')
        };
    },
    
    render() {
        const grid = this.elements.picker.querySelector('.emoji-grid');
        grid.innerHTML = EMOJIS.map(emoji =>
            `<span class="emoji">${emoji}</span>`
        ).join('');
    },
    
    bindEvents() {
        this.elements.btn.addEventListener('click', (e) => {
            e.stopPropagation();
            State.toggleEmojiPicker();
        });
        
        this.elements.picker.addEventListener('click', (e) => {
            if (e.target.classList.contains('emoji')) {
                Input.insertEmoji(e.target.textContent);
                State.closeEmojiPicker();
            }
        });
        
        document.addEventListener('click', (e) => {
            if (!this.elements.picker.contains(e.target) &&
                !this.elements.btn.contains(e.target)) {
                State.closeEmojiPicker();
            }
        });
    },
    
    bindStateEvents() {
        State.subscribe((event, data) => {
            if (event === 'emojiToggle') {
                this.elements.picker.classList.toggle('active', data);
            } else if (event === 'emojiClosed') {
                this.elements.picker.classList.remove('active');
            }
        });
    }
};
