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
            reactionPicker: document.getElementById('reactionPicker')
        };
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
        });
    },
    
    bindStateEvents() {
        State.subscribe((event, data) => {
            if (event === 'chatChanged') {
                this.shouldScrollToBottom = false;
                this.render();
            } else if (event === 'messageAdded') {
                this.shouldScrollToBottom = true;
                this.render();
            } else if (event === 'messageEdited' || 
                event === 'messageDeleted' || event === 'messagesDeleted' || 
                event === 'reactionChanged') {
                this.render();
            } else if (event === 'selectModeChanged') {
                this.toggleSelectMode(data.active);
            } else if (event === 'selectionChanged') {
                this.updateSelectionUI(data);
            }
        });
    },
    
    render() {
        const chat = State.getCurrentChat();
        if (!chat) return;
        
        this.elements.container.innerHTML = chat.messages.map(msg => this.renderMessage(msg, chat)).join('');
        
        if (this.shouldScrollToBottom) {
            this.scrollToBottom();
        } else {
            this.restoreScrollPosition();
            this.shouldScrollToBottom = true;
        }
    },
    
    renderMessage(msg, chat) {
        const outgoing = !msg.incoming;
        const isVoice = msg.type === 'voice';
        const isImage = msg.type === 'image';
        const isFile = msg.type === 'file';
        const hasReactions = msg.reactions && Object.keys(msg.reactions).length > 0;
        
        const avatarHtml = !outgoing
            ? `${Helpers.avatarHtml(chat.name, 30, 'message-avatar')}`
            : '';
        const senderHtml = msg.sender
            ? `<span class="message-sender">${Helpers.escapeHtml(msg.sender)}</span>`
            : '';
        const statusHtml = outgoing ? this.getStatusIcon(msg.status) : '';
        const replyHtml = msg.replyTo ? this.renderReply(msg.replyTo, chat) : '';
        const editedHtml = msg.edited ? ' <span class="edited-mark">изм.</span>' : '';
        const forwardedHtml = msg.forwarded ? ' <span class="forwarded-mark">↗ Переслано</span>' : '';
        
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
                ${msg.text ? `<p>${Helpers.escapeHtml(msg.text)}</p>` : ''}
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
            bubbleHtml = `<div class="message-bubble">
                <p>${Helpers.escapeHtml(msg.text)}${editedHtml}${forwardedHtml}</p>
                ${metaHtml}
            </div>`;
        }
        
        const reactionsHtml = hasReactions ? this.renderReactions(msg) : '';
        const selectorHtml = `<div class="message-selector"></div>`;
        
        return `
            <div class="message ${outgoing ? 'outgoing' : 'incoming'}${isVoice ? ' voice-message' : ''}${isImage ? ' image-message' : ''}${isFile ? ' file-message' : ''}${msg.edited ? ' edited' : ''}" data-id="${msg.id}">
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
        const reactions = Object.entries(msg.reactions || {});
        return `<div class="message-reactions">
            ${reactions.map(([emoji, users]) => {
                const hasYou = users.includes('you');
                const count = users.filter(u => u === 'you').length + users.filter(u => u === 'other').length;
                return `<span class="message-reaction${hasYou ? ' has-you' : ''}" data-emoji="${emoji}">
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
    }
};
