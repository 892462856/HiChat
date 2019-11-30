import Vue from 'vue'
import Vuex from 'vuex'
import DataSource from '@/datasources/database'
import MessageStorage from '@/storage/messageStorage'
import CommonCacheAccessor from '@/assets/js/commonCacheAccessor'

Vue.use(Vuex)

const keys = {
  myInfo: 'myInfo',
  lmw: 'lmw',
  groups: 'groups',
  friends: 'friends',
  users: 'users',
  chats: 'chats'
}

const commonErrorMonitor = function (type, error)
{
  const popup = Vue.prototype.$message
  if (!popup) return
  if (error && error.message.toLocaleLowerCase().indexOf('timeout') > -1)
  {
    error.message = '服务器超时，请重试。'
  }
  popup.error({ message: error.message || error })
}
const ds = new DataSource(commonErrorMonitor)
let mStorage = new MessageStorage(caches.get(keys.myInfo) ? caches.get(keys.myInfo).id : 'xxxx')
const caches = new CommonCacheAccessor(window.sessionStorage)

const store = new Vuex.Store({
  state: {
    commStatus: {}, // {code,str}
    lmw: null, // lmw='',
    myInfo: null, // 我(登陆者)的信息
    friends: null, // [],
    groups: null, // [],
    convrs: null, // [], // 会话列表
    chats: {} // {targetId:{target,messages},......}  当前聊天对象(friend/group)===当前聊天窗口
    // currentChatTarget: null, // 当前聊天对象(friend/group)===当前聊天窗口
    // currentChatMessages: null // []
  },
  getters: {
    commStatus: state => state.commStatus, // 通讯状态
    lmw: state =>
    {
      if (state.lmw === null && store.getters.myInfo.id)
      {
        store.commit('update_lmw', caches.get(keys.lmw))
      }
      return state.lmw
    },
    myInfo: state =>
    {
      if (state.myInfo === null)
      {
        store.commit('update_myInfo', caches.get(keys.myInfo) || {})
      }
      return state.myInfo || {}
    },
    friends: state =>
    {
      if (!state.friends && store.getters.myInfo.id)
      {
        caches.get(keys.friends, ds.getFriends).then(list => store.commit('update_friends', list))
      }
      return state.friends || []
    },
    groups: state =>
    {
      if (!state.groups && store.getters.myInfo.id)
      {
        caches.get(keys.groups, ds.getGroups).then(list => store.commit('update_groups', list))
      }
      return state.groups || []
    },
    convrs: state =>
    {
      if (!state.convrs && store.getters.myInfo.id)
      {
        mStorage.getConvrs().then(list => store.commit('update_convrs', list))
      }
      return state.convrs || []
    },
    chats: state =>
    {
      if (state.chats === null && store.getters.myInfo.id)
      {
        store.commit('update_chats', caches.get(keys.chats))
      }
      return state.chats || {}
    },
    // currentChatTarget: state =>
    // {
    //   if (state.currentChatTarget === null  && store.getters.myInfo.id)
    //   {
    //     store.commit('update_currentChatTarget', caches.get(keys.currentChatTarget))
    //   }
    //   return state.currentChatTarget || {}
    // },
    // currentChatMessages: state =>
    // {
    //   if (state.currentChatMessages === null && store.getters.myInfo.id)
    //   {
    //     mStorage.get(store.getters.currentChatTarget.targetId).then(list => store.commit('update_currentChatMessages', list))
    //   }
    //   return state.currentChatMessages || []
    // }
  },
  mutations: {
    update_commStatus (state, status)
    {
      state.commStatus = status
    },
    update_lmw (state, name)
    {
      caches.set(keys.lmw, name)
      state.lmw = name
    },
    update_myInfo (state, myInfo)
    {
      caches.set(keys.myInfo, myInfo)
      state.myInfo = myInfo
    },
    update_friends (state, list)
    {
      caches.set(keys.friends, list)
      state.friends = list
    },
    update_groups (state, list)
    {
      caches.set(keys.groups, list)
      state.groups = list
    },
    update_convrs (state, list)
    {
      state.convrs = list
    },
    update_chats (state, targets)
    {
      const chats = store.getters.chats
      const newTargets = targets.filter(target => !chats[target.id])
      newTargets.forEach(target => chats[target.id] = { target, messages: [] })
      const msgGetters = newTargets.map(target =>
      {
        return mStorage.get(target.id)
          .then(storage => ({ targetId: target.id, messages: storage }))
      })
      Promise.all(msgGetters).then(results =>
      {
        chats[results.targetId].messages = results.messages
        store.commit('update_chats', chats)

        results.forEach(result => mStorage.readConvr(result.targetId))
        store.commit('update_convrs', store.getters.convrs)
      })

      caches.set(keys.chats, chats)
      state.chats = chats
    }
    // update_currentChatTarget (state, target)
    // {
    //   caches.set(keys.currentChatTarget, target)
    //   state.currentChatTarget = target
    //   store.commit('update_currentChatMessages', null)

    //   if (target && target.targetId)
    //   {
    //     store.commit('updateToRead_conversation', target.targetId)
    //   }
    // },
    // update_currentChatMessages (state, list)
    // {
    //   state.currentChatMessages = list
    // }
  }
})

export default store

export const login = function ({ mobile, password })
{
  return ds.login({ mobile, password }).then(myInfo =>
  {
    mStorage = new MessageStorage(myInfo.id)
    store.commit('update_myInfo', myInfo)
    return myInfo
  })
} // 创建MessageStorage
export const logout = function ()
{
  return ds.logout().then(() =>
  {
    Object.keys(keys).forEach(key =>
    {
      caches.set(keys[key])
    })
  })
} // 清除缓存
export const logoutState = function ()
{
  store.commit('update_lmw', null)
  store.commit('update_chats', null)
  store.commit('update_myInfo', null)
  store.commit('update_friends', null)
  store.commit('update_groups', null)
  store.commit('update_convrs', null)
  mStorage = null
} // 清除store

export const updateLMW = (name) => store.commit('update_lmw', name)

export const updateChats = (targets) => store.commit('update_chats', targets)

export const updateMyName = function (name)
{
  if (name === store.getters.myInfo.name) return

  const myInfo = store.getters.myInfo
  return ds.updateUserName({ id: myInfo.id, name }).then(() =>
  {
    myInfo.name = name
    store.commit('update_myInfo', myInfo)
  })
}
export const updateMyIco = function (ico)
{
  if (ico === store.getters.myInfo.ico) return

  const myInfo = store.getters.myInfo
  return ds.updateUserIco({ id: myInfo.id, ico }).then(() =>
  {
    myInfo.ico = ico
    store.commit('update_myInfo', myInfo)
  })
}
export const updateMyMobile = function ({ mobile, verifyCode })
{
  if (mobile === store.getters.myInfo.mobile) return

  const myInfo = store.getters.myInfo
  return ds.updateMobile({ id: myInfo.id, mobile, verifyCode }).then(() =>
  {
    myInfo.mobile = mobile
    store.commit('update_myInfo', myInfo)
  })
}

const appendFriend = function (friend)
{
  const friends = store.getters.friends
  if (friends.find(t => t.id === friend.id)) return friend
  friends.push(friend)
  store.commit('update_friends', friends)
  return friend
}
const appendGroup = function (group)
{
  delete group.deleted
  const groups = store.getters.groups
  if (groups.find(t => t.id === group.id)) return group
  groups.push(group)
  store.commit('update_groups', groups)
  return group
}
const removeGroup = function (targetId, flag = true)
{
  const groups = store.getters.groups
  const group = groups.find(t => t.targetId === targetId)
  if (!group) return
  if (flag)
  {
    group.deleted = true
  }
  else
  {
    groups.splice(groups.indexOf(group), 1)
  }
  store.commit('update_groups', groups)
}

export const addFriend = (mobile) => ds.addFriend(mobile).then(friend => appendFriend(friend))
export const addGroup = (name, membersId) => ds.addGroup({ name, membersId }).then(group => appendGroup(group))

/**
 * 追加消息
 * @param {*} msg
 */
const appendToCurrentChatMessages = function (msg)
{
  if (!msg) return
  const list = store.getters.currentChatMessages
  list.push(msg)
  store.commit('update_currentChatMessages', list)
}
/**
 * 更新会话列表
 * @param {*} convr
 */
const updateConversations = function (convr)
{
  if (!convr) return
  let list = store.getters.convrs
  list = list.filter(t => t.targetId !== convr.targetId)
  list.unshift(convr)
  store.commit('update_convrs', list)
}
export const removeConversation = function (targetId)
{
  return mStorage.removeConversation(targetId).then(() =>
  {
    store.commit('update_convrs', store.getters.convrs.filter(t => t.targetId !== targetId))
    if (targetId === store.getters.currentChatTarget.targetId)
    {
      store.commit('update_currentChatMessages', null)
    }
  })
}

const messageListener = function ({ message, convr, senderUser, target })
{
  if (message && store.getters.currentChatTarget && store.getters.currentChatTarget.targetId === message.targetId)
  {
    appendToCurrentChatMessages(message)
  } // 如果是当前聊天窗口的消息，则追加到currentChatMessages
  if (convr)
  {
    updateConversations(convr)
  }

  if (message && message.content && message.content.extra === 'AddFriend')
  {
    appendFriend(senderUser)
  } // 加好友
  if ((message && message.content && message.content.extra === 'AddGroup') || (message && message.messageType === 'GroupNotificationMessage' && (['Create', 'Add'].includes(message.content.operation))))
  {
    appendGroup(target)
  } // 加群
  if (message && message.messageType === 'GroupNotificationMessage' && message.content.operation === 'Rename')
  {
    const groups = store.getters.groups
    const group = groups.find(t => t.targetId === message.targetId)
    if (group)
    {
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

export const LinkCommunicationAndListening = function ()
{
  return LinkCommunicationAndListeningForRong(store.getters.myInfo.token, (message) =>
  {
    // console.log(message)
    const read = !!store.getters.currentChatTarget.targetId && store.getters.currentChatTarget.targetId === message.targetId
    const _messageReceiver = messageReceiver[message.messageType] || messageReceiver.default
    _messageReceiver(message, read).then(({ message: msg, convr, senderUser, target }) =>
    {
      messageListener({ message: msg, convr, senderUser, target })
    })
  }, (status) =>
  {
    store.commit('update_commStatus', status)
  })
}

const sendMessage = function (sendHander)
{
  return function (msgObj)
  {
    return sendHander({
      ...msgObj,
      sender: store.getters.myInfo,
      target: store.getters.currentChatTarget
    }).then(({ message, convr, senderUser, target }) =>
    {
      console.log(message)
      messageListener({ message, convr, senderUser, target })
    })
  }
}

export const sendText = sendMessage((obj) => mStorage.sendText(obj))
export const sendEncryptText = sendMessage((obj) => mStorage.sendEncryptText(obj))
export const sendImage = sendMessage((obj) => mStorage.sendImage(obj))
export const sendFile = sendMessage((obj) => mStorage.sendFile(obj))

export const exitGroup = function (targetId)
{
  return exitGroupByApp(targetId).then(data =>
  {
    removeConversation(targetId)
    removeGroup(targetId, false)
    return data
  })
}
export const deleteGroup = function (targetId)
{
  return deleteGroupByApp(targetId).then(data =>
  {
    removeConversation(targetId)
    removeGroup(targetId)
    return data
  })
}
export const addToBlacklist = function (id)
{
  const friends = store.getters.friends
  const friend = friends.find(t => t.id === id)
  return addBlckUser([id]).then(d =>
  {
    removeConversation(friend.targetId)
    friends.splice(friends.indexOf(friend), 1)
    store.commit('update_friends', friends)
    if (store.getters.currentChatTarget.targetId === friend.targetId)
    {
      store.commit('update_currentChatTarget', null)
    }
    return d
  })
}
export const removeFromBlacklist = function (item)
{
  return delBlckUser([item.id]).then(d =>
  {
    const friends = store.getters.friends
    friends.unshift({ ...item })
    store.commit('update_friends', friends)
    return d
  })
}
