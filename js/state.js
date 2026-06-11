export const State = {
    currentChat: null,
    chats: {},
    replyToMessageId: null,
    editMessageId: null,
    selectedMessages: new Set(),
    selectMode: false,
    emojiPickerOpen: false,
    stickerPickerOpen: false,
    isRecording: false,
    recordingStartedAt: null,
    recordingInterval: null,
    showArchived: false,
    searchQuery: '',
    searchResults: [],
    chatSearchOpen: false,
    chatSearchQuery: '',
    theme: 'dark',
    accentColor: '#3b82f6',
    fontSize: 'medium',
    
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
        this.replyToMessageId = null;
        this.editMessageId = null;
        this.selectedMessages.clear();
        this.selectMode = false;
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
    },
    
    toggleArchivedView() {
        this.showArchived = !this.showArchived;
        this.notify('archivedViewToggled', this.showArchived);
    },
    
    setGlobalSearch(query) {
        this.searchQuery = query;
        this.notify('globalSearchChanged', query);
    },
    
    setChatSearch(query) {
        this.chatSearchQuery = query;
        this.notify('chatSearchChanged', query);
    },
    
    toggleChatSearch() {
        this.chatSearchOpen = !this.chatSearchOpen;
        if (!this.chatSearchOpen) this.chatSearchQuery = '';
        this.notify('chatSearchToggled', this.chatSearchOpen);
    },
    
    toggleStickerPicker() {
        this.stickerPickerOpen = !this.stickerPickerOpen;
        this.notify('stickerToggle', this.stickerPickerOpen);
    },
    
    closeStickerPicker() {
        if (!this.stickerPickerOpen) return;
        this.stickerPickerOpen = false;
        this.notify('stickerClosed');
    },
    
    setTheme(theme) {
        this.theme = theme;
        localStorage.setItem('cat_theme', theme);
        this.notify('themeChanged', theme);
    },
    
    setAccentColor(color) {
        this.accentColor = color;
        localStorage.setItem('cat_accent', color);
        document.documentElement.style.setProperty('--accent', color);
        this.notify('accentChanged', color);
    },
    
    setFontSize(size) {
        this.fontSize = size;
        localStorage.setItem('cat_fontsize', size);
        this.notify('fontSizeChanged', size);
    },
    
    loadPreferences() {
        const theme = localStorage.getItem('cat_theme');
        const accent = localStorage.getItem('cat_accent');
        const fontsize = localStorage.getItem('cat_fontsize');
        if (theme) this.theme = theme;
        if (accent) {
            this.accentColor = accent;
            document.documentElement.style.setProperty('--accent', accent);
        }
        if (fontsize) this.fontSize = fontsize;
    }
};
