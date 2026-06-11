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

const GIPHY_API_KEY = 'dc6zaTOxFJmzC';
const GIPHY_LIMIT = 20;

export const Stickers = {
    elements: {},
    gifSearchTimeout: null,

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
                <div class="gif-tab-content" id="gifTabContent" style="display:none">
                    <div class="gif-search-box">
                        <svg class="gif-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                        </svg>
                        <input type="text" class="gif-search-input" id="gifSearchInput" placeholder="Поиск GIF..." autocomplete="off">
                    </div>
                    <div class="gif-grid" id="gifGrid"></div>
                </div>
            </div>
        `;

        const inputContainer = document.getElementById('messageInputContainer');
        inputContainer.parentNode.insertBefore(picker, inputContainer);

        this.elements = {
            picker: picker,
            stickerGrid: picker.querySelector('#stickerGrid'),
            gifTabContent: picker.querySelector('#gifTabContent'),
            gifGrid: picker.querySelector('#gifGrid'),
            gifSearchInput: picker.querySelector('#gifSearchInput'),
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
                    this.elements.gifTabContent.style.display = 'none';
                } else {
                    this.elements.stickerGrid.style.display = 'none';
                    this.elements.gifTabContent.style.display = 'flex';
                    if (this.elements.gifGrid.children.length === 0) {
                        this.loadTrending();
                    }
                    setTimeout(() => this.elements.gifSearchInput?.focus(), 100);
                }
            });
        });

        this.elements.gifSearchInput.addEventListener('input', (e) => {
            clearTimeout(this.gifSearchTimeout);
            const query = e.target.value.trim();
            if (!query) {
                this.loadTrending();
                return;
            }
            this.gifSearchTimeout = setTimeout(() => this.searchGifs(query), 500);
        });

        this.renderStickers();
    },

    bindStateEvents() {
        State.subscribe((event, data) => {
            if (event === 'stickerToggle') {
                this.elements.picker.classList.toggle('active', data);
                if (data) {
                    this.elements.gifSearchInput.value = '';
                }
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

    async loadTrending() {
        try {
            const response = await fetch(
                `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=${GIPHY_LIMIT}&rating=g`
            );
            const data = await response.json();
            if (data.data) {
                this.renderGifResults(data.data);
            }
        } catch (e) {
            this.elements.gifGrid.innerHTML = '<div class="gif-empty">Не удалось загрузить GIF</div>';
        }
    },

    async searchGifs(query) {
        if (!query) return;
        this.elements.gifGrid.innerHTML = '<div class="gif-loading"><div class="spinner"></div></div>';
        try {
            const response = await fetch(
                `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=${GIPHY_LIMIT}&rating=g`
            );
            const data = await response.json();
            if (data.data) {
                this.renderGifResults(data.data);
            } else {
                this.elements.gifGrid.innerHTML = '<div class="gif-empty">Ничего не найдено</div>';
            }
        } catch (e) {
            this.elements.gifGrid.innerHTML = '<div class="gif-empty">Ошибка поиска</div>';
        }
    },

    renderGifResults(gifs) {
        if (!gifs || gifs.length === 0) {
            this.elements.gifGrid.innerHTML = '<div class="gif-empty">Ничего не найдено</div>';
            return;
        }

        this.elements.gifGrid.innerHTML = gifs.map(gif => {
            const url = gif.images?.fixed_height?.url || gif.images?.original?.url || '';
            return `<div class="gif-item" data-url="${url}">
                <img src="${url}" alt="${gif.title || 'GIF'}" loading="lazy">
            </div>`;
        }).join('');

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
