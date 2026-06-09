export const State = {
    currentChat: null,
    chats: {},
    replyToMessageId: null,
    emojiPickerOpen: false,
    
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
        this.notify('replyChanged', messageId);
    },
    
    clearReply() {
        this.replyToMessageId = null;
        this.notify('replyCleared');
    },
    
    toggleEmojiPicker() {
        this.emojiPickerOpen = !this.emojiPickerOpen;
        this.notify('emojiToggle', this.emojiPickerOpen);
    },
    
    closeEmojiPicker() {
        this.emojiPickerOpen = false;
        this.notify('emojiClosed');
    }
};
