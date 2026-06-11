import { State } from '../state.js';
import { API } from '../api.js';
import { Chat } from './chat.js';
import { Drafts } from './drafts.js';

export const Input = {
    elements: {},
    typingTimeout: null,
    onEmpty: null,
    
    init() {
        this.cacheElements();
        this.bindEvents();
        this.bindStateEvents();
        this.toggleMode();
    },
    
    cacheElements() {
        this.elements = {
            input: document.getElementById('messageInput'),
            sendBtn: document.getElementById('sendBtn'),
            voiceBtn: document.getElementById('voiceBtn'),
            container: document.getElementById('messageInputContainer'),
            replyPreview: document.getElementById('replyPreview'),
            replyText: document.getElementById('replyText'),
            replyCancel: document.getElementById('replyCancel'),
            editPreview: document.getElementById('editPreview'),
            editPreviewText: document.getElementById('editPreviewText'),
            editCancel: document.getElementById('editCancel'),
            voiceRecorder: document.getElementById('voiceRecorder'),
            voiceTimer: document.getElementById('voiceTimer'),
            voiceWave: document.getElementById('voiceWave'),
            voiceCancelBtn: document.getElementById('voiceCancelBtn'),
            voiceSendBtn: document.getElementById('voiceSendBtn')
        };
    },
    
    bindEvents() {
        this.elements.input.addEventListener('input', () => {
            this.autoResize();
            this.toggleMode();
            if (State.currentChat) {
                Drafts.setDraft(State.currentChat, this.elements.input.value);
            }
        });
        
        this.elements.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.send();
            }
        });
        
        this.elements.sendBtn.addEventListener('click', () => this.send());
        this.elements.replyCancel.addEventListener('click', () => State.clearReply());
        
        this.elements.editCancel.addEventListener('click', () => {
            State.clearEdit();
            this.elements.input.value = '';
            this.autoResize();
        });
        
        this.elements.voiceBtn.addEventListener('mousedown', () => this.startVoiceRecord());
        this.elements.voiceBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.startVoiceRecord(); });
        this.elements.voiceBtn.addEventListener('mouseup', () => this.stopVoiceRecord());
        this.elements.voiceBtn.addEventListener('touchend', () => this.stopVoiceRecord());
        
        this.elements.voiceCancelBtn.addEventListener('click', () => this.cancelVoiceRecord());
        this.elements.voiceSendBtn.addEventListener('click', () => this.sendVoiceRecord());
    },
    
    bindStateEvents() {
        State.subscribe((event, data) => {
            if (event === 'replyChanged') this.showReplyPreview();
            else if (event === 'replyCleared') this.hideReplyPreview();
            else if (event === 'editChanged') this.showEditPreview(data);
            else if (event === 'editCleared') this.hideEditPreview();
            else if (event === 'recordingStopped') this.finishRecording(data);
        });
    },
    
    toggleMode() {
        const hasText = this.elements.input.value.trim().length > 0;
        if (hasText === this.onEmpty) return;
        this.onEmpty = hasText;
        
        if (hasText) {
            this.elements.container.classList.remove('voice-mode');
        } else {
            this.elements.container.classList.add('voice-mode');
        }
    },
    
    send() {
        const text = this.elements.input.value.trim();
        if (!text || !State.currentChat) return;
        
        if (State.editMessageId) {
            API.editMessage(State.currentChat, State.editMessageId, text);
            State.clearEdit();
        } else {
            const message = API.addMessage(State.currentChat, {
                text,
                incoming: false,
                replyTo: State.replyToMessageId
            });
            
            if (State.replyToMessageId) State.clearReply();
            
            this.simulateStatusUpdates(message.id);
            this.simulateReply();
        }
        
        Drafts.setDraft(State.currentChat, '');
        this.clear();
    },
    
    simulateStatusUpdates(messageId) {
        setTimeout(() => {
            API.updateMessageStatus(State.currentChat, messageId, 'delivered');
        }, 1000);
        
        setTimeout(() => {
            API.updateMessageStatus(State.currentChat, messageId, 'read');
        }, 2000);
    },
    
    simulateReply() {
        Chat.showTyping();
        
        setTimeout(() => {
            Chat.hideTyping();
            
            const replies = [
                'Понял, хорошо!', 'Отличная идея!', 'Давай обсудим это завтра',
                'Согласен!', 'Интересно, расскажи подробнее', 'Ок, принято 👍',
                'Спасибо за информацию!', 'Буду иметь в виду', 'Хорошо, жду!', 'Да, конечно!'
            ];
            
            API.addMessage(State.currentChat, {
                text: replies[Math.floor(Math.random() * replies.length)],
                incoming: true
            });
        }, 2500);
    },
    
    audioCtx: null,
    analyser: null,
    animFrame: null,
    waveBars: [],
    amplitudes: [],
    
    startVoiceRecord() {
        this._recording = true;
        this._stopped = false;
        this.elements.voiceRecorder.classList.add('active', 'recording');
        this.amplitudes = [];
        this.waveBars = Array.from(this.elements.voiceWave.children);
        
        navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
            if (!this._recording) return;
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioCtx.createAnalyser();
            this.analyser.fftSize = 64;
            const source = this.audioCtx.createMediaStreamSource(stream);
            source.connect(this.analyser);
            this._drawWave();
        }).catch(() => {
            if (!this._recording) return;
            this.waveBars.forEach((b, i) => {
                const h = 4 + Math.sin(i * 0.5 + Date.now() * 0.01) * 12;
                b.style.height = h + 'px';
            });
            this._simWave();
        });
        
        State.startRecording();
        let seconds = 0;
        State.recordingInterval = setInterval(() => {
            seconds++;
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            this.elements.voiceTimer.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        }, 1000);
    },
    
    _drawWave() {
        if (!this.analyser || !this._recording) return;
        const data = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(data);
        let max = 0;
        const step = Math.floor(data.length / this.waveBars.length);
        this.waveBars.forEach((bar, i) => {
            const val = data[i * step] / 255;
            if (val > max) max = val;
            const h = max > 0.04 ? (3 + val * 33) : 3;
            bar.style.height = h + 'px';
        });
        this.amplitudes.push(max);
        this.animFrame = requestAnimationFrame(() => this._drawWave());
    },
    
    _simWave() {
        if (this.animFrame) return;
        const draw = () => {
            if (!this.elements.voiceRecorder.classList.contains('recording')) return;
            this.waveBars.forEach((b, i) => {
                const h = 4 + Math.sin(i * 0.5 + Date.now() * 0.005) * 12;
                b.style.height = h + 'px';
            });
            this.animFrame = requestAnimationFrame(draw);
        };
        draw();
    },
    
    stopVoiceRecord() {
        if (this._stopped) return;
        this._stopped = true;
        this._recording = false;
        State.stopRecording();
        this._cleanupAudio();
        this.elements.voiceTimer.textContent = '0:00';
        clearInterval(State.recordingInterval);
    },
    
    cancelVoiceRecord() {
        this._stopped = true;
        this._recording = false;
        this._cleanupAudio();
        this.elements.voiceTimer.textContent = '0:00';
        clearInterval(State.recordingInterval);
        State.isRecording = false;
    },
    
    _cleanupAudio() {
        if (this.animFrame) { cancelAnimationFrame(this.animFrame); this.animFrame = null; }
        if (this.audioCtx) { this.audioCtx.close().catch(() => {}); this.audioCtx = null; this.analyser = null; }
        this.elements.voiceRecorder.classList.remove('active', 'recording');
    },
    
    finishRecording(duration) {
        if (duration < 1) return;
        
        const amps = this.amplitudes.length > 0 ? [...this.amplitudes] : null;
        this.amplitudes = [];
        
        API.addMessage(State.currentChat, {
            text: 'Голосовое сообщение',
            incoming: false,
            type: 'voice',
            voiceDuration: duration,
            voiceAmplitudes: amps
        });
    },
    
    sendVoiceRecord() {
        if (State.isRecording) {
            State.stopRecording();
            clearInterval(State.recordingInterval);
        }
    },
    
    autoResize() {
        this.elements.input.style.height = 'auto';
        this.elements.input.style.height = Math.min(this.elements.input.scrollHeight, 100) + 'px';
    },
    
    showReplyPreview() {
        const chat = State.getCurrentChat();
        const msg = chat?.messages.find(m => String(m.id) === String(State.replyToMessageId));
        if (msg) {
            this.elements.replyText.textContent = msg.text.substring(0, 50) + '...';
            this.elements.replyPreview.classList.add('active');
            this.elements.input.focus();
        }
    },
    
    hideReplyPreview() {
        this.elements.replyPreview.classList.remove('active');
    },
    
    showEditPreview(msgId) {
        const chat = State.getCurrentChat();
        const msg = chat?.messages.find(m => String(m.id) === String(msgId));
        if (msg) {
            this.elements.editPreviewText.textContent = msg.text.substring(0, 50) + '...';
            this.elements.editPreview.classList.add('active');
            this.elements.input.value = msg.text;
            this.autoResize();
            this.elements.input.focus();
            this.elements.container.classList.remove('voice-mode');
            this.onEmpty = true;
        }
    },
    
    hideEditPreview() {
        this.elements.editPreview.classList.remove('active');
    },
    
    clear() {
        this.elements.input.value = '';
        this.elements.input.style.height = 'auto';
        this.elements.container.classList.add('voice-mode');
        this.elements.editPreview.classList.remove('active');
        this.elements.replyPreview.classList.remove('active');
        this.onEmpty = false;
    },
    
    insertEmoji(emoji) {
        this.elements.input.value += emoji;
        this.elements.input.focus();
        this.autoResize();
        this.toggleMode();
    },
    
    insertGif(url) {
        if (!State.currentChat) return;
        API.addMessage(State.currentChat, {
            text: '',
            incoming: false,
            type: 'image',
            file: { name: 'GIF', url: url, type: 'image/gif' }
        });
    }
};
