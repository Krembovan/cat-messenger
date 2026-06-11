import { State } from '../state.js';
import { API } from '../api.js';
import { Helpers } from '../utils/helpers.js';

export const GroupChats = {
    init() {
        this.bindEvents();
    },
    
    bindEvents() {
        const createGroupBtn = document.getElementById('createGroupBtn');
        if (createGroupBtn) {
            createGroupBtn.addEventListener('click', () => this.showCreateGroupModal());
        }
    },
    
    showCreateGroupModal() {
        const modal = document.createElement('div');
        modal.className = 'overlay active';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>Создать группу</h3>
                    <button class="icon-btn modal-close">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    <input type="text" class="group-name-input" placeholder="Название группы" id="groupNameInput">
                    <div class="group-members-list" id="groupMembersList">
                        <h4>Выберите участников</h4>
                        <div class="members-grid"></div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" id="createGroupConfirm">Создать</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const membersGrid = modal.querySelector('.members-grid');
        const chats = Object.values(State.chats).filter(c => !c.isGroup);
        
        membersGrid.innerHTML = chats.map(chat => `
            <label class="member-checkbox">
                <input type="checkbox" value="${chat.id}">
                ${Helpers.avatarHtml(chat.name, 40)}
                <span>${chat.name}</span>
            </label>
        `).join('');
        
        modal.querySelector('.modal-close').onclick = () => modal.remove();
        modal.querySelector('#createGroupConfirm').onclick = () => {
            const name = modal.querySelector('#groupNameInput').value.trim();
            const selectedMembers = Array.from(membersGrid.querySelectorAll('input:checked'))
                .map(input => input.value);
            
            if (!name) {
                Helpers.showToast('Введите название группы');
                return;
            }
            
            if (selectedMembers.length < 1) {
                Helpers.showToast('Выберите хотя бы одного участника');
                return;
            }
            
            this.createGroup(name, selectedMembers);
            modal.remove();
        };
    },
    
    createGroup(name, memberIds) {
        const groupId = 'group_' + Date.now();
        const members = memberIds.map(id => {
            const chat = State.chats[id];
            return { id, name: chat.name };
        });
        
        State.chats[groupId] = {
            id: groupId,
            name: name,
            status: `${members.length + 1} участников`,
            online: false,
            pinned: false,
            muted: false,
            archived: false,
            wallpaper: null,
            unreadCount: 0,
            isGroup: true,
            members: members,
            messages: []
        };
        
        API.save();
        State.setCurrentChat(groupId);
        Helpers.showToast('Группа создана');
    },
    
    addMemberToGroup(groupId, memberId) {
        const group = State.chats[groupId];
        if (!group || !group.isGroup) return;
        
        const member = State.chats[memberId];
        if (!member) return;
        
        if (!group.members.find(m => m.id === memberId)) {
            group.members.push({ id: memberId, name: member.name });
            group.status = `${group.members.length + 1} участников`;
            API.save();
        }
    },
    
    removeMemberFromGroup(groupId, memberId) {
        const group = State.chats[groupId];
        if (!group || !group.isGroup) return;
        
        group.members = group.members.filter(m => m.id !== memberId);
        group.status = `${group.members.length + 1} участников`;
        API.save();
    }
};
