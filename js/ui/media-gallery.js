import { State } from '../state.js';
import { API } from '../api.js';
import { Helpers } from '../utils/helpers.js';

export const MediaGallery = {
    init() {
        this.bindEvents();
    },
    
    bindEvents() {
        const mediaBtn = document.getElementById('profileMediaBtn');
        const filesBtn = document.getElementById('profileFilesBtn');
        
        if (mediaBtn) {
            mediaBtn.onclick = () => this.showMediaGallery();
        }
        
        if (filesBtn) {
            filesBtn.onclick = () => this.showFilesGallery();
        }
    },
    
    showMediaGallery() {
        if (!State.currentChat) return;
        
        const media = API.getMediaMessages(State.currentChat);
        
        const modal = document.createElement('div');
        modal.className = 'overlay active';
        modal.innerHTML = `
            <div class="modal modal-large">
                <div class="modal-header">
                    <h3>Медиа (${media.length})</h3>
                    <button class="icon-btn modal-close">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="media-grid">
                        ${media.length === 0 ? '<p class="empty-state">Нет медиа файлов</p>' : 
                            media.map(msg => {
                                if (msg.type === 'image' && msg.file?.url) {
                                    return `<div class="media-item" data-url="${msg.file.url}">
                                        <img src="${msg.file.url}" alt="Media" loading="lazy">
                                    </div>`;
                                } else if (msg.type === 'voice') {
                                    return `<div class="media-item voice-item">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                                            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                                        </svg>
                                        <span>${msg.voiceDuration || 0}с</span>
                                    </div>`;
                                }
                                return '';
                            }).join('')
                        }
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('.modal-close').onclick = () => modal.remove();
        
        modal.querySelectorAll('.media-item[data-url]').forEach(item => {
            item.onclick = () => {
                const url = item.dataset.url;
                const preview = document.getElementById('imagePreview');
                const overlay = document.getElementById('imageOverlay');
                preview.src = url;
                overlay.classList.add('active');
            };
        });
    },
    
    showFilesGallery() {
        if (!State.currentChat) return;
        
        const files = API.getFilesMessages(State.currentChat);
        
        const modal = document.createElement('div');
        modal.className = 'overlay active';
        modal.innerHTML = `
            <div class="modal modal-large">
                <div class="modal-header">
                    <h3>Файлы (${files.length})</h3>
                    <button class="icon-btn modal-close">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="files-list">
                        ${files.length === 0 ? '<p class="empty-state">Нет файлов</p>' : 
                            files.map(msg => `
                                <div class="file-item">
                                    <div class="file-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                            <polyline points="14 2 14 8 20 8"/>
                                        </svg>
                                    </div>
                                    <div class="file-info">
                                        <div class="file-name">${Helpers.escapeHtml(msg.file?.name || 'Файл')}</div>
                                        <div class="file-size">${msg.file?.size ? Helpers.formatFileSize(msg.file.size) : ''}</div>
                                    </div>
                                    <div class="file-date">${msg.time}</div>
                                </div>
                            `).join('')
                        }
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.querySelector('.modal-close').onclick = () => modal.remove();
    }
};
