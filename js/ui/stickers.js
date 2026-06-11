import { State } from '../state.js';
import { Input } from './input.js';

const STICKERS = [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
    '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
    '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
    '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
    '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮',
    '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓',
    '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺',
    '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣',
    '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈',
    '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖'
];

const GIFS = [
    { url: 'https://media2.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif', title: 'Thumbs up' },
    { url: 'https://media4.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif', title: 'Applause' },
    { url: 'https://media3.giphy.com/media/26gsjCZpPolPr3sBy/giphy.gif', title: 'Hello' },
    { url: 'https://media0.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif', title: 'Love' },
    { url: 'https://media1.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif', title: 'Dance' },
    { url: 'https://media2.giphy.com/media/26u4kr12SkmfEOvmM/giphy.gif', title: 'Party' },
    { url: 'https://media3.giphy.com/media/3o7abB06u9bNzA8lu8/giphy.gif', title: 'Cool' },
    { url: 'https://media4.giphy.com/media/l0HlNQ03J5JxX6lva/giphy.gif', title: 'Wow' }
];

export const Stickers = {
    elements: {},
    
    init() {
        this.cacheElements();
        this.bindEvents();
        this.bindStateEvents();
    },
    
    cacheElements() {
        const picker = document.createElement('div');
        picker.id = 'stickerPicker';
        picker.className = 'sticker-picker';
        picker.innerHTML = `
            <div class="sticker-tabs">
                <button class="sticker-tab active" data-tab="stickers">Стикеры</button>
                <button class="sticker-tab" data-tab="gifs">GIF</button>
            </div>
            <div class="sticker-content">
                <div class="sticker-grid" id="stickerGrid"></div>
                <div class="gif-grid" id="gifGrid" style="display:none"></div>
            </div>
        `;
        
        const inputContainer = document.getElementById('messageInputContainer');
        inputContainer.parentNode.insertBefore(picker, inputContainer);
        
        this.elements = {
            picker: picker,
            stickerGrid: picker.querySelector('#stickerGrid'),
            gifGrid: picker.querySelector('#gifGrid'),
            tabs: picker.querySelectorAll('.sticker-tab')
        };
    },
    
    bindEvents() {
        this.elements.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.elements.tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const tabName = tab.dataset.tab;
                if (tabName === 'stickers') {
                    this.elements.stickerGrid.style.display = 'grid';
                    this.elements.gifGrid.style.display = 'none';
                } else {
                    this.elements.stickerGrid.style.display = 'none';
                    this.elements.gifGrid.style.display = 'grid';
                }
            });
        });
        
        this.renderStickers();
        this.renderGifs();
    },
    
    bindStateEvents() {
        State.subscribe((event, data) => {
            if (event === 'stickerToggle') {
                this.elements.picker.classList.toggle('active', data);
            } else if (event === 'stickerClosed') {
                this.elements.picker.classList.remove('active');
            }
        });
    },
    
    renderStickers() {
        this.elements.stickerGrid.innerHTML = STICKERS.map(sticker =>
            `<span class="sticker-item" data-sticker="${sticker}">${sticker}</span>`
        ).join('');
        
        this.elements.stickerGrid.querySelectorAll('.sticker-item').forEach(item => {
            item.addEventListener('click', () => {
                Input.insertEmoji(item.dataset.sticker);
                State.closeStickerPicker();
            });
        });
    },
    
    renderGifs() {
        this.elements.gifGrid.innerHTML = GIFS.map(gif =>
            `<div class="gif-item" data-url="${gif.url}">
                <span class="gif-placeholder">${gif.title}</span>
                <img src="${gif.url}" alt="${gif.title}" loading="lazy" 
                     onerror="this.style.display='none'">
            </div>`
        ).join('');
        
        this.elements.gifGrid.querySelectorAll('.gif-item').forEach(item => {
            item.addEventListener('click', () => {
                const url = item.dataset.url;
                if (Input.insertGif(url)) {
                    State.closeStickerPicker();
                }
            });
        });
    }
};
