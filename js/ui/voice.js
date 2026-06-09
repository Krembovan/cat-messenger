import { State } from '../state.js';
import { API } from '../api.js';
import { Helpers } from '../utils/helpers.js';

export const Voice = {
    mediaRecorder: null,
    audioChunks: [],
    recordingTimer: null,
    seconds: 0,
    
    init() {
        this.bindEvents();
    },
    
    bindEvents() {
        State.subscribe((event) => {
            if (event === 'recordingStarted') this.showRecordingUI();
            else if (event === 'recordingStopped') this.onRecordingComplete();
        });
    },
    
    async requestMic() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            return stream;
        } catch {
            return null;
        }
    },
    
    showRecordingUI() {
        const el = document.getElementById('voiceRecorder');
        const wave = document.getElementById('voiceWave');
        el.classList.add('active', 'recording');
        wave.classList.add('animating');
        document.getElementById('messageInputContainer').classList.add('hidden');
        
        this.seconds = 0;
        this.startTimer();
        
        this.requestMic().then(stream => {
            if (stream) {
                this.mediaRecorder = new MediaRecorder(stream);
                this.audioChunks = [];
                this.mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) this.audioChunks.push(e.data);
                };
                this.mediaRecorder.start(100);
            }
        });
    },
    
    startTimer() {
        this.recordingTimer = setInterval(() => {
            this.seconds++;
            const mins = Math.floor(this.seconds / 60);
            const secs = this.seconds % 60;
            document.getElementById('voiceTimer').textContent = 
                `${mins}:${secs.toString().padStart(2, '0')}`;
        }, 1000);
    },
    
    onRecordingComplete() {
        clearInterval(this.recordingTimer);
        const el = document.getElementById('voiceRecorder');
        el.classList.remove('active', 'recording');
        document.getElementById('voiceWave').classList.remove('animating');
        document.getElementById('messageInputContainer').classList.remove('hidden');
        document.getElementById('voiceTimer').textContent = '0:00';
        
        if (this.seconds > 0 && State.currentChat) {
            API.addMessage(State.currentChat, {
                text: '🎤 Голосовое сообщение',
                incoming: false,
                type: 'voice',
                voiceDuration: this.seconds
            });
        }
        
        this.seconds = 0;
        
        if (this.mediaRecorder) {
            this.mediaRecorder.stop();
            this.mediaRecorder.stream.getTracks().forEach(t => t.stop());
            this.mediaRecorder = null;
        }
    }
};
