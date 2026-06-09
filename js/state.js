export const State = {
    currentChat: null,
    chats: {},
    replyToMessageId: null,
    editMessageId: null,
    selectedMessages: new Set(),
    selectMode: false,
    emojiPickerOpen: false,
    isRecording: false,
    recordingStartedAt: null,
    recordingInterval: null,
    
    listeners: [],
    
    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    },
    
    notify(event, data) {
        this.listeners.forEach(callback => callback(event, data));
    },
    
    setCurrentChat(chatId) {
        this.currentChat = chatId;
        this.notify('chatChanged', chatId);
    },
    
    getCurrentChat() {
        return this.chats[this.currentChat];
    },
    
    setReplyTo(messageId) {
        this.replyToMessageId = messageId;
        this.editMessageId = null;
        this.notify('replyChanged', messageId);
    },
    
    clearReply() {
        this.replyToMessageId = null;
        this.notify('replyCleared');
    },
    
    setEditMessage(messageId) {
        this.editMessageId = messageId;
        this.replyToMessageId = null;
        this.notify('editChanged', messageId);
    },
    
    clearEdit() {
        this.editMessageId = null;
        this.notify('editCleared');
    },
    
    toggleSelectMode() {
        this.selectMode = !this.selectMode;
        this.selectedMessages.clear();
        if (!this.selectMode) this.notify('selectModeChanged', { active: false });
        else this.notify('selectModeChanged', { active: true });
    },
    
    toggleMessageSelection(messageId) {
        if (this.selectedMessages.has(messageId)) {
            this.selectedMessages.delete(messageId);
        } else {
            this.selectedMessages.add(messageId);
        }
        this.notify('selectionChanged', Array.from(this.selectedMessages));
    },
    
    clearSelection() {
        this.selectedMessages.clear();
        this.selectMode = false;
        this.notify('selectModeChanged', { active: false });
    },
    
    toggleEmojiPicker() {
        this.emojiPickerOpen = !this.emojiPickerOpen;
        this.notify('emojiToggle', this.emojiPickerOpen);
    },
    
    closeEmojiPicker() {
        if (!this.emojiPickerOpen) return;
        this.emojiPickerOpen = false;
        this.notify('emojiClosed');
    },
    
    startRecording() {
        this.isRecording = true;
        this.recordingStartedAt = Date.now();
        this.notify('recordingStarted');
    },
    
    stopRecording() {
        this.isRecording = false;
        this.notify('recordingStopped', this.getRecordingDuration());
    },
    
    getRecordingDuration() {
        if (!this.recordingStartedAt) return 0;
        return Math.floor((Date.now() - this.recordingStartedAt) / 1000);
    }
};
