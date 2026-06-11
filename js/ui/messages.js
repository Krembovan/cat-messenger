import { State } from '../state.js';
import { API } from '../api.js';
import { Helpers } from '../utils/helpers.js';
import { ContextMenu } from './context-menu.js';

export const Messages = {
    elements: {},
    reactionTimeout: null,
    scrollPositions: {},
    shouldScrollToBottom: true,
    
    init() {
        this.cacheElements();
        this.bindEvents();
        this.bindStateEvents();
    },
    
    cacheElements() {
        this.elements = {
            container: document.getElementById('messagesContainer'),
            reactionPicker: document.getElementById('reactionPicker'),
            floatingDate: document.getElementById('floatingDate')
        };
        if (State.compactMode) {
            this.elements.container.classList.add('compact-mode');
        }
    },
    
    bindEvents() {
        this.elements.container.addEventListener('click', (e) => {
            const sel = e.target.closest('.message-selector');
            if (sel) {
                const msgEl = sel.closest('.message');
                const msgId = msgEl.dataset.id;
                State.toggleMessageSelection(msgId);
                return;
            }
            
            const react = e.target.closest('.message-reaction');
            if (react) {
                const msgEl = react.closest('.message');
                const msgId = msgEl.dataset.id;
                const emoji = react.dataset.emoji;
                API.toggleReaction(State.currentChat, msgId, emoji);
                return;
            }
            
            const playBtn = e.target.closest('.voice-play-btn');
            if (playBtn) {
                this.toggleVoicePlayback(playBtn);
                return;
            }
            
            const img = e.target.closest('.message-image');
            if (img) {
                document.getElementById('imagePreview').src = img.src;
                document.getElementById('imageOverlay').classList.add('active');
                return;
            }
        });
        
        this.elements.container.addEventListener('contextmenu', (e) => {
            const msgEl = e.target.closest('.message');
            if (!msgEl) return;
            e.preventDefault();
            this.elements.reactionPicker.classList.remove('active');
            this.showReactionPicker(e.clientX, e.clientY, msgEl);
        });
        
        let longPressTimer;
        this.elements.container.addEventListener('touchstart', (e) => {
            const msgEl = e.target.closest('.message');
            if (!msgEl || State.selectMode) return;
            
            longPressTimer = setTimeout(() => {
                this.showReactionPicker(
                    e.touches[0].clientX,
                    e.touches[0].clientY,
                    msgEl
                );
            }, 500);
        });
        
        this.elements.container.addEventListener('touchend', () => {
            clearTimeout(longPressTimer);
        });
        
        this.elements.container.addEventListener('touchmove', () => {
            clearTimeout(longPressTimer);
        });
        
        document.addEventListener('click', (e) => {
            if (!this.elements.reactionPicker.contains(e.target)) {
                this.elements.reactionPicker.classList.remove('active');
                this.elements.reactionPicker._msgId = null;
            }
        });
        
        this.elements.container.addEventListener('scroll', () => {
            this.saveScrollPosition();
            this.updateScrollButton();
            this.updateFloatingDate();
        });
        
        const scrollBtn = document.getElementById('scrollToBottomBtn');
        if (scrollBtn) {
            scrollBtn.addEventListener('click', () => this.scrollToBottomSmooth());
        }
    },
    
    bindStateEvents() {
        State.subscribe((event, data) => {
            if (event === 'compactModeChanged') {
                this.elements.container.classList.toggle('compact-mode', data);
            } else if (event === 'chatChanged') {
                this.shouldScrollToBottom = false;
                this.render();
                this.applyWallpaper();
            } else if (event === 'messageAdded') {
                this.shouldScrollToBottom = true;
                this.render();
            } else if (event === 'messageEdited' || 
                event === 'messageDeleted' || event === 'messagesDeleted' || 
                event === 'reactionChanged' || event === 'messagePinned' ||
                event === 'messageBookmarked') {
                this.render();
            } else if (event === 'selectModeChanged') {
                this.toggleSelectMode(data.active);
            } else if (event === 'selectionChanged') {
                this.updateSelectionUI(data);
            } else if (event === 'chatSearchChanged') {
                if (data) {
                    this.highlightSearchResults(data);
                } else {
                    this.clearSearchHighlights();
                }
            } else if (event === 'wallpaperChanged') {
                this.applyWallpaper();
            }
        });
    },
    
    applyWallpaper() {
        const chat = State.getCurrentChat();
        if (!chat) return;
        
        const container = this.elements.container;
        if (chat.wallpaper) {
            container.style.background = chat.wallpaper;
        } else {
            container.style.background = '';
        }
    },
    
    render() {
        const chat = State.getCurrentChat();
        if (!chat) return;
        
        let html = '';
        let lastDate = null;
        let lastSender = null;
        let lastIncoming = null;
        
        chat.messages.forEach((msg, index) => {
            const msgDate = new Date(msg.timestamp || Date.now());
            const dateStr = this.formatDateSeparator(msgDate);
            
            if (dateStr !== lastDate) {
                html += `<div class="message date-divider"><span>${dateStr}</span></div>`;
                lastDate = dateStr;
                lastSender = null;
                lastIncoming = null;
            }
            
            const isGrouped = msg.incoming === lastIncoming && 
                             msg.sender === lastSender &&
                             index > 0 &&
                             (msg.timestamp - chat.messages[index - 1].timestamp) < 300000;
            
            html += this.renderMessage(msg, chat, isGrouped);
            
            lastSender = msg.sender;
            lastIncoming = msg.incoming;
        });
        
        this.elements.container.innerHTML = html;
        
        if (State.chatSearchQuery) {
            this.highlightSearchResults(State.chatSearchQuery);
        }
        
        if (this.shouldScrollToBottom) {
            this.scrollToBottom();
        } else {
            this.restoreScrollPosition();
            this.shouldScrollToBottom = true;
        }
        
        this.updateScrollButton();
    },
    
    formatDateSeparator(date) {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (date.toDateString() === today.toDateString()) {
            return 'Сегодня';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Вчера';
        } else {
            return date.toLocaleDateString('ru-RU', { 
                day: 'numeric', 
                month: 'long',
                year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
            });
        }
    },
    
    renderMessage(msg, chat, isGrouped = false) {
        const outgoing = !msg.incoming;
        const isVoice = msg.type === 'voice';
        const isImage = msg.type === 'image';
        const isFile = msg.type === 'file';
        const hasReactions = msg.reactions && Object.keys(msg.reactions).length > 0;
        
        const avatarHtml = (!outgoing && !isGrouped)
            ? `${Helpers.avatarHtml(chat.name, 30, 'message-avatar')}`
            : (!outgoing ? '<div style="width:30px;flex-shrink:0"></div>' : '');
        const senderHtml = (msg.sender && !isGrouped)
            ? `<span class="message-sender">${Helpers.escapeHtml(msg.sender)}</span>`
            : '';
        const statusHtml = outgoing ? this.getStatusIcon(msg.status) : '';
        const replyHtml = msg.replyTo ? this.renderReply(msg.replyTo, chat) : '';
        const editedHtml = msg.edited ? ' <span class="edited-mark">изм.</span>' : '';
        const forwardedHtml = msg.forwarded ? ' <span class="forwarded-mark">↗ Переслано</span>' : '';
        const pinnedHtml = msg.pinned ? ' <span class="pinned-mark"><svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z"/></svg></span>' : '';
        const bookmarkedHtml = msg.bookmarked ? ' <span class="bookmarked-mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg></span>' : '';
        
        const metaHtml = `<div class="message-meta">
            <span class="message-time">${msg.time}</span>
            ${statusHtml}
        </div>`;
        
        let bubbleHtml = '';
        if (isVoice) {
            bubbleHtml = this.renderVoiceBubble(msg, metaHtml);
        } else if (isImage && msg.file?.url) {
            bubbleHtml = `<div class="message-bubble">
                <img src="${msg.file.url}" alt="Photo" class="message-image">
                ${metaHtml}
                ${msg.text ? `<p>${API.formatText(msg.text)}</p>` : ''}
            </div>`;
        } else if (isFile && msg.file) {
            bubbleHtml = `<div class="message-bubble">
                <div class="message-file">
                    <span class="message-file-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                        </svg>
                    </span>
                    <div><strong>${Helpers.escapeHtml(msg.file.name)}</strong><br><small>${msg.file.size ? Helpers.formatFileSize(msg.file.size) : ''}</small></div>
                </div>
                ${metaHtml}
            </div>`;
        } else {
            const formattedText = API.formatText(msg.text);
            bubbleHtml = `<div class="message-bubble">
                <p>${formattedText}${editedHtml}${forwardedHtml}${pinnedHtml}${bookmarkedHtml}</p>
                ${metaHtml}
            </div>`;
        }
        
        const reactionsHtml = hasReactions ? this.renderReactions(msg) : '';
        const selectorHtml = `<div class="message-selector"></div>`;
        
        return `
            <div class="message ${outgoing ? 'outgoing' : 'incoming'}${isGrouped ? ' grouped' : ''}${isVoice ? ' voice-message' : ''}${isImage ? ' image-message' : ''}${isFile ? ' file-message' : ''}${msg.edited ? ' edited' : ''}${msg.pinned ? ' pinned' : ''}${msg.bookmarked ? ' bookmarked' : ''}" data-id="${msg.id}">
                ${avatarHtml}
                ${selectorHtml}
                <div class="message-content">
                    ${senderHtml}
                    ${replyHtml}
                    ${bubbleHtml}
                    ${reactionsHtml}
                </div>
            </div>
        `;
    },
    
    renderVoiceBubble(msg, metaHtml) {
        const amps = msg.voiceAmplitudes;
        const count = 20;
        const bars = [];
        let hasAudio = false;
        if (amps && amps.length > 0) {
            const maxAmp = Math.max(...amps);
            hasAudio = maxAmp > 0.08;
            const step = Math.max(1, Math.floor(amps.length / count));
            for (let i = 0; i < count; i++) {
                const slice = amps.slice(i * step, (i + 1) * step);
                const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
                const h = hasAudio ? (4 + avg * 22) : 3;
                bars.push(`<div class="bar" style="height:${h}px"></div>`);
            }
        } else {
            for (let i = 0; i < count; i++) {
                bars.push(`<div class="bar" style="height:3px"></div>`);
            }
        }
        const duration = msg.voiceDuration ? `${msg.voiceDuration}c` : '';
        return `
            <div class="message-bubble voice-bubble">
                <button class="voice-play-btn">
                    <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </button>
                <div class="voice-bars">${bars.join('')}</div>
                <span class="voice-duration">${duration}</span>
                ${metaHtml}
            </div>
        `;
    },
    
    toggleVoicePlayback(btn) {
        const isPlaying = btn.classList.toggle('playing');
        const playIcon = '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
        const pauseIcon = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
        btn.innerHTML = isPlaying ? pauseIcon : playIcon;
        
        const bars = btn.parentElement.querySelectorAll('.voice-bars .bar');
        bars.forEach(b => b.classList.toggle('active', isPlaying));
        
        if (!isPlaying) {
            bars.forEach(b => b.classList.remove('active'));
        }
    },
    
    renderReactions(msg) {
        const chat = State.getCurrentChat();
        const chatName = chat ? chat.name : 'Собеседник';
        const reactions = Object.entries(msg.reactions || {});
        return `<div class="message-reactions">
            ${reactions.map(([emoji, users]) => {
                const hasYou = users.includes('you');
                const count = users.length;
                const tooltip = users.map(u => u === 'you' ? 'Вы' : chatName).join(', ');
                return `<span class="message-reaction${hasYou ? ' has-you' : ''}" data-emoji="${emoji}" title="${tooltip}">
                    ${emoji}<span class="reaction-count">${count}</span>
                </span>`;
            }).join('')}
        </div>`;
    },
    
    renderReply(replyToId, chat) {
        const replyMsg = chat.messages.find(m => String(m.id) === String(replyToId));
        if (!replyMsg) return '';
        const text = replyMsg.text.substring(0, 50) + (replyMsg.text.length > 50 ? '...' : '');
        return `<div class="message-reply">${Helpers.escapeHtml(text)}</div>`;
    },
    
    getStatusIcon(status) {
        const icons = {
            sent: '<svg class="message-status" viewBox="0 0 16 16"><path d="M3 8l3 3 7-7" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
            delivered: '<svg class="message-status" viewBox="0 0 16 16"><path d="M1 8l3 3 7-7M5 8l3 3 7-7" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
            read: '<svg class="message-status read" viewBox="0 0 16 16"><path d="M1 8l3 3 7-7M5 8l3 3 7-7" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>'
        };
        return icons[status] || '';
    },
    
    showReactionPicker(x, y, msgEl) {
        const msgId = String(msgEl.dataset.id);
        const chat = State.getCurrentChat();
        if (!chat) return;
        
        const msg = chat.messages.find(m => String(m.id) === msgId);
        if (!msg) return;
        
        this.elements.reactionPicker._msgId = msgId;
        this.elements.reactionPicker.classList.add('active');
        
        const rect = msgEl.getBoundingClientRect();
        const pw = 220;
        const left = Math.max(8, Math.min(rect.left + rect.width / 2 - pw / 2, window.innerWidth - pw - 8));
        const top = Math.max(8, rect.top - 54);
        
        this.elements.reactionPicker.style.left = left + 'px';
        this.elements.reactionPicker.style.top = top + 'px';
        
        ContextMenu.show(msgEl);
    },
    
    toggleSelectMode(active) {
        const main = document.getElementById('chatMain');
        main.classList.toggle('select-mode-active', active);
        
        document.querySelectorAll('.message-selector').forEach(s => {
            s.classList.remove('checked');
        });
        
        if (!active) {
            document.getElementById('selectCount').textContent = '0 выбрано';
        }
    },
    
    updateSelectionUI(selectedIds) {
        document.getElementById('selectCount').textContent = selectedIds.length + ' выбрано';
        document.querySelectorAll('.message').forEach(el => {
            const mid = el.dataset.id;
            const sel = el.querySelector('.message-selector');
            sel.classList.toggle('checked', selectedIds.includes(mid));
        });
    },
    
    scrollToBottom() {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const el = this.elements.container;
                el.scrollTop = el.scrollHeight;
            });
        });
    },
    
    saveScrollPosition() {
        if (!State.currentChat) return;
        this.scrollPositions[State.currentChat] = this.elements.container.scrollTop;
    },
    
    restoreScrollPosition() {
        const saved = this.scrollPositions[State.currentChat];
        if (saved !== undefined) {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    this.elements.container.scrollTop = saved;
                });
            });
        } else {
            this.scrollToBottom();
        }
    },
    
    updateScrollButton() {
        const container = this.elements.container;
        const scrollBtn = document.getElementById('scrollToBottomBtn');
        if (!scrollBtn) return;
        
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200;
        scrollBtn.classList.toggle('visible', !isNearBottom);
    },
    
    scrollToBottomSmooth() {
        this.elements.container.scrollTo({
            top: this.elements.container.scrollHeight,
            behavior: 'smooth'
        });
    },
    
    highlightSearchResults(query) {
        if (!query) return;
        const lower = query.toLowerCase();
        const messages = this.elements.container.querySelectorAll('.message');
        
        messages.forEach(msgEl => {
            const bubble = msgEl.querySelector('.message-bubble p');
            if (!bubble) return;
            
            const text = bubble.textContent;
            if (text.toLowerCase().includes(lower)) {
                msgEl.classList.add('search-match');
                const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                bubble.innerHTML = bubble.innerHTML.replace(regex, '<mark class="search-highlight">$1</mark>');
            } else {
                msgEl.classList.remove('search-match');
            }
        });
    },
    
    updateFloatingDate() {
        const el = this.elements.floatingDate;
        if (!el) return;

        clearTimeout(this._dateTimeout);

        const dividers = this.elements.container.querySelectorAll('.date-divider');
        const containerRect = this.elements.container.getBoundingClientRect();
        let foundText = '';

        for (const div of dividers) {
            const rect = div.getBoundingClientRect();
            if (rect.top >= containerRect.top && rect.top <= containerRect.top + containerRect.height * 0.6) {
                foundText = div.textContent.trim();
                break;
            }
        }

        if (foundText) {
            el.textContent = foundText;
            el.classList.add('visible');
            this._dateTimeout = setTimeout(() => el.classList.remove('visible'), 1500);
        } else {
            el.classList.remove('visible');
        }
    },

    clearSearchHighlights() {
        const messages = this.elements.container.querySelectorAll('.message.search-match');
        messages.forEach(msgEl => {
            msgEl.classList.remove('search-match');
            const highlights = msgEl.querySelectorAll('.search-highlight');
            highlights.forEach(h => {
                h.replaceWith(h.textContent);
            });
        });
    }
};
