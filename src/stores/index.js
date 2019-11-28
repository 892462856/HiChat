import Vue from 'vue'
import Vuex from 'vuex'
import setCommonErrorMonitor, { delBlckUser, addBlckUser, deleteGroup as deleteGroupByApp, exitGroup as exitGroupByApp, updateUserName, changeUserDetail2, changeUserDetail as changeUserDetailByApp, getGroups, getFriends, addFriend as addFriendByApp, addGroup as addGroupByApp, LinkCommunicationAndListening as LinkCommunicationAndListeningForRong, login as loginApp, logout as logoutApp, logouted } from '@/cacheAccessor'
import MessageStorage from '@/cacheAccessor/messageStorage'
import CommonCacheAccessor from '@/cacheAccessor/CommonCacheAccessor'

export { setGroupCast, getBlackUsers, setBlackUserPwd, changeTelMessage, forgetPWDMessage, saveForgetPWD, changPwd, updateGroupName, getGroupMembers, addGroupMember, removeGroupMember, updateGroupUserName, uploadFile, searchUser, register, registerVerifyCode } from '@/cacheAccessor'
export { emojiApi } from '@/cacheAccessor'

Vue.use(Vuex)

const keys = {
    myInfo: 'myInfo',
    lastMyWindow: 'lastMyWindow',
    currentChatTarget: 'currentChatTarget',
    groups: 'groups',
    friends: 'friends',
    users: 'users'
}

const commonErrorMonitor = function (type, error) {
    const popup = Vue.prototype.$message
    if (!popup) return
    if (error && error.message.toLocaleLowerCase().indexOf('timeout') > -1) {
        error.message = '服务器超时，请重试。'
    }
    popup.error({ message: error.message || error })
}
setCommonErrorMonitor(commonErrorMonitor)

const cca = new CommonCacheAccessor(window.sessionStorage)
let mStorage = new MessageStorage(cca.get(keys.myInfo) ? cca.get(keys.myInfo).id : 'xxxx')

const store = new Vuex.Store({
    state: {
        communicationStatus: 0, // rong链接状态
        lastMyWindow: null, // '',
        myInfo: null, // 我(登陆者)的信息
        friends: null, // [],
        groups: null, // [],
        conversations: null, // [], // 会话列表
        currentChatTarget: null, // 当前聊天对象(friend/group)===当前聊天窗口
        currentChatMessages: null // []
    },
    getters: {
        communicationStatus: state => state.communicationStatus, // 通讯状态
        lastMyWindow: state => {
            if (state.lastMyWindow === null && store.getters.myInfo.id) {
                store.commit('update_lastMyWindow', cca.get(keys.lastMyWindow))
            }
            return state.lastMyWindow
        },
        myInfo: state => {
            // debugger
            if (state.myInfo === null) {
                store.commit('update_myInfo', cca.get(keys.myInfo) || {})
            }
            return state.myInfo || {}
        },
        friends: state => {
            if (!state.friends && store.getters.myInfo && store.getters.myInfo.id) {
                cca.get(keys.friends, getFriends).then(list => store.commit('update_friends', list))
            }
            return state.friends || []
        },
        groups: state => {
            if (!state.groups && store.getters.myInfo && store.getters.myInfo.id) {
                cca.get(keys.groups, getGroups).then(list => store.commit('update_groups', list))
            }
            return state.groups || []
        },
        conversations: state => {
            if (!state.conversations && store.getters.myInfo && store.getters.myInfo.id) {
                mStorage.getConversations().then(list => store.commit('update_conversations', list))
            }
            return state.conversations || []
        },
        currentChatTarget: state => {
            if (state.currentChatTarget === null && store.getters.myInfo && store.getters.myInfo.id) {
                store.commit('update_currentChatTarget', cca.get(keys.currentChatTarget))
            }
            return state.currentChatTarget || {}
        },
        currentChatMessages: state => {
            if (state.currentChatMessages === null && store.getters.myInfo && store.getters.myInfo.id) {
                mStorage.get(store.getters.currentChatTarget.targetId).then(list => store.commit('update_currentChatMessages', list))
            }
            return state.currentChatMessages || []
        }
    },
    mutations: {
        update_communicationStatus(state, status) {
            state.communicationStatus = status
        },
        update_lastMyWindow(state, name) {
            cca.set(keys.lastMyWindow, name)
            state.lastMyWindow = name
        },
        update_myInfo(state, myInfo) {
            // debugger
            cca.set(keys.myInfo, myInfo)
            state.myInfo = myInfo
        },
        update_friends(state, list) {
            cca.set(keys.friends, list)
            state.friends = list
        },
        update_groups(state, list) {
            cca.set(keys.groups, list)
            state.groups = list
        },
        update_conversations(state, list) {
            state.conversations = list
        },
        /**
         * 更新一条会话为已读
         * @param {*} state
         * @param {*} targetId
         */
        updateToRead_conversation(state, targetId) {
            const list = store.getters.conversations
            const item = list.find(t => t.targetId === targetId)
            if (item) {
                item.unreadMessageCount = 0
                mStorage.updateConversation(targetId, convr => {
                    convr.unreadMessageCount = 0
                })
                store.commit('update_conversations', list)
            }
        },
        /**
         * 更新currentChatTarget
         * @param {*} state
         * @param {{ id:string, type:string, target:{} }} obj
         */
        update_currentChatTarget(state, target) {
            cca.set(keys.currentChatTarget, target)
            state.currentChatTarget = target
            store.commit('update_currentChatMessages', null)

            if (target && target.targetId) {
                store.commit('updateToRead_conversation', target.targetId)
            }
        },
        update_currentChatMessages(state, list) {
            state.currentChatMessages = list
        }
    }
})

export default store

export const login = function ({ name, password, region }) {
    return loginApp({ name, password, region }).then(myInfo => {
        mStorage = new MessageStorage(myInfo.id)
        store.commit('update_myInfo', myInfo)
        return myInfo
    })
} // 创建MessageStorage
export const logout = function () {
    return logoutApp(store.getters.myInfo.telephone).then(() => {
        Object.keys(keys).forEach(key => {
            cca.set(keys[key])
        })
    })
} // 清除缓存
export const logoutState = function () {
    logouted()
    store.commit('update_lastMyWindow', null)
    store.commit('update_currentChatTarget', null)
    store.commit('update_myInfo', null)
    store.commit('update_friends', null)
    store.commit('update_groups', null)
    store.commit('update_conversations', null)
    mStorage = null
} // 清除store

export const updateLastMyWindow = function (name) {
    store.commit('update_lastMyWindow', name)
}
export const updateCurrentChatTarget = function (target) {
    store.commit('update_currentChatTarget', target)
}

export const editNickName = function (nickName) {
    const myInfo = store.getters.myInfo
    const oldName = myInfo.name
    myInfo.name = nickName
    return changeUserDetailByApp({ telephone: myInfo.telephone, nickName: myInfo.name, fileContent: '', ex: '' }).then(() => {
        store.commit('update_myInfo', myInfo)
    }).catch(error => {
        myInfo.name = oldName
        throw error
    })
}
export const editPhoto = function (formData, ex) {
    const myInfo = store.getters.myInfo
    return changeUserDetail2(formData, { telephone: myInfo.telephone, nickName: myInfo.name, ex })
}
export const editTelephone = function ({ telephone, activeCode, region }) {
    return updateUserName({ telephone, activeCode, region }).then(() => {
        const myInfo = store.getters.myInfo
        myInfo.telephone = telephone
        store.commit('update_myInfo', myInfo)
    })
}

const appendFriend = function (friend) {
    const friends = store.getters.friends
    if (friends.find(t => t.id === friend.id)) return
    friends.push(friend)
    store.commit('update_friends', friends)
}
const appendGroup = function (group) {
    delete group.deleted
    const groups = store.getters.groups
    if (groups.find(t => t.id === group.id)) return
    groups.push(group)
    store.commit('update_groups', groups)
}
const removeGroup = function (targetId, flag = true) {
    const groups = store.getters.groups
    const group = groups.find(t => t.targetId === targetId)
    if (!group) return
    if (flag) {
        group.deleted = true
    } else {
        groups.splice(groups.indexOf(group), 1)
    }
    store.commit('update_groups', groups)
}

export const addFriend = function (telephone) {
    return addFriendByApp(telephone).then(friend => {
        appendFriend(friend)
        return friend
    })
}
export const addGroup = function (ids) {
    return addGroupByApp({ ids }).then(group => {
        appendGroup(group)
        return group
    })
}

/**
 * 追加消息
 * @param {*} msg
 */
const appendToCurrentChatMessages = function (msg) {
    if (!msg) return
    const list = store.getters.currentChatMessages
    list.push(msg)
    store.commit('update_currentChatMessages', list)
}
/**
 * 更新会话列表
 * @param {*} convr
 */
const updateConversations = function (convr) {
    if (!convr) return
    let list = store.getters.conversations
    list = list.filter(t => t.targetId !== convr.targetId)
    list.unshift(convr)
    store.commit('update_conversations', list)
}
export const removeConversation = function (targetId) {
    return mStorage.removeConversation(targetId).then(() => {
        store.commit('update_conversations', store.getters.conversations.filter(t => t.targetId !== targetId))
        if (targetId === store.getters.currentChatTarget.targetId) {
            store.commit('update_currentChatMessages', null)
        }
    })
}

const messageListener = function ({ message, convr, senderUser, target }) {
    if (message && store.getters.currentChatTarget && store.getters.currentChatTarget.targetId === message.targetId) {
        appendToCurrentChatMessages(message)
    } // 如果是当前聊天窗口的消息，则追加到currentChatMessages
    if (convr) {
        updateConversations(convr)
    }

    if (message && message.content && message.content.extra === 'AddFriend') {
        appendFriend(senderUser)
    } // 加好友
    if ((message && message.content && message.content.extra === 'AddGroup') || (message && message.messageType === 'GroupNotificationMessage' && (['Create', 'Add'].includes(message.content.operation)))) {
        appendGroup(target)
    } // 加群
    if (message && message.messageType === 'GroupNotificationMessage' && message.content.operation === 'Rename') {
        const groups = store.getters.groups
        const group = groups.find(t => t.targetId === message.targetId)
        if (group) {
            group.name = message.content.data.targetGroupName
            store.commit('update_groups', groups)
        }
    } // 修改群名称
}

const messageReceiver = {
    TextMessage: (msg, read) => mStorage.receiveText(msg, read),
    ImageMessage: (msg, read) => mStorage.receiveImage(msg, read),
    FileMessage: (msg, read) => mStorage.receiveFile(msg, read),
    HQVoiceMessage: (msg, read) => mStorage.receiveHQVoice(msg, read),
    RichContentMessage: (msg, read) => mStorage.receiveRichContent(msg, read),
    TypingStatusMessage: (msg, read) => mStorage.receiveTypingStatus(msg, read),
    ReadReceiptMessage: (msg, read) => mStorage.receiveReadReceipt(msg, read),
    GroupNotificationMessage: (msg, read) => mStorage.receiveGroupNotification(msg, read),
    UnknownMessage: (msg, read) => mStorage.receiveUnknown(msg, read),
    default: (msg, read) => mStorage.receiveOther(msg, read)
}

export const LinkCommunicationAndListening = function () {
    return LinkCommunicationAndListeningForRong(store.getters.myInfo.token, (message) => {
        // console.log(message)
        const read = !!store.getters.currentChatTarget.targetId && store.getters.currentChatTarget.targetId === message.targetId
        const _messageReceiver = messageReceiver[message.messageType] || messageReceiver.default
        _messageReceiver(message, read).then(({ message: msg, convr, senderUser, target }) => {
            messageListener({ message: msg, convr, senderUser, target })
        })
    }, (status) => {
        store.commit('update_communicationStatus', status)
    })
}

const sendMessage = function (sendHander) {
    return function (msgObj) {
        return sendHander({
            ...msgObj,
            sender: store.getters.myInfo,
            target: store.getters.currentChatTarget
        }).then(({ message, convr, senderUser, target }) => {
            console.log(message)
            messageListener({ message, convr, senderUser, target })
        })
    }
}

export const sendText = sendMessage((obj) => mStorage.sendText(obj))
export const sendEncryptText = sendMessage((obj) => mStorage.sendEncryptText(obj))
export const sendImage = sendMessage((obj) => mStorage.sendImage(obj))
export const sendFile = sendMessage((obj) => mStorage.sendFile(obj))

export const exitGroup = function (targetId) {
    return exitGroupByApp(targetId).then(data => {
        removeConversation(targetId)
        removeGroup(targetId, false)
        // if (store.getters.currentChatTarget.targetId === targetId) {
        //     store.commit('update_currentChatTarget', null)
        // }
        return data
    })
}
export const deleteGroup = function (targetId) {
    return deleteGroupByApp(targetId).then(data => {
        removeConversation(targetId)
        removeGroup(targetId)
        // if (store.getters.currentChatTarget.targetId === targetId) {
        //     store.commit('update_currentChatTarget', null)
        // }
        return data
    })
}
export const addToBlacklist = function (id) {
    const friends = store.getters.friends
    const friend = friends.find(t => t.id === id)
    return addBlckUser([id]).then(d => {
        removeConversation(friend.targetId)
        friends.splice(friends.indexOf(friend), 1)
        store.commit('update_friends', friends)
        if (store.getters.currentChatTarget.targetId === friend.targetId) {
            store.commit('update_currentChatTarget', null)
        }
        return d
    })
}
export const removeFromBlacklist = function (item) {
    return delBlckUser([item.id]).then(d => {
        const friends = store.getters.friends
        friends.unshift({ ...item })
        store.commit('update_friends', friends)
        return d
    })
}
