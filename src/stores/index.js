import Vue from 'vue'
import Vuex from 'vuex'
import DataSource from '@/datasources/database'
import Messager from '@/datasources/messager'
import MessageStorage from '@/storage/messageStorage'
import models from '@/models'
import { MessageType, TargetType } from '@/models/commonType'
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
const msger = new Messager(caches.get(keys.myInfo) ? caches.get(keys.myInfo).id : null)
let msgStorage = new MessageStorage(caches.get(keys.myInfo) ? caches.get(keys.myInfo).id : 'xxxx')
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
        msgStorage.getConvrs().then(list => store.commit('update_convrs', list))
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
    }
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
      const getTargetsPromises = list.filter(t => !t.target).map(convr =>
      {
        const target = convr.targetType === TargetType.friend
          ? store.state.friends.find(t => t.id === convr.targetId)
          : store.state.groups.find(t => t.id === convr.targetId)
        if (target) return Promise.resolve(target)

        const getTargetPromise = target
          ? Promise.resolve(target)
          : convr.targetType === TargetType.friend
            ? ds.getFriend(convr.targetId).then(friend =>
            {
              const friends = store.state.friends
              friends.unshift(friend)
              store.commit('update_friends', friends)
              return friend
            })
            : ds.getGroup(convr.targetId).then(group =>
            {
              const groups = store.state.groups
              groups.unshift(group)
              store.commit('update_groups', groups)
              return group
            })

        getTargetPromise.then(target =>
        {
          convr.target = target
        })
      })
      Promise.allSettled(getTargetsPromises).then(() =>
      {
        store.commit('update_convrs', store.getters.convrs)
      })  // +target

      state.convrs = list
    },
    update_chats (state, targets)
    {
      const chats = store.getters.chats
      {
        const newTargets = targets.filter(target => !chats[target.id])
        newTargets.forEach(target => chats[target.id] = { target, messages: [] })
        const msgGetters = newTargets.map(target =>
        {
          return msgStorage.get(target.id)
            .then(storage => ({ targetId: target.id, messages: storage }))
        })
        Promise.all(msgGetters).then(results =>
        {
          chats[results.targetId].messages = results.messages
          store.commit('update_chats', chats)

          results.forEach(result => msgStorage.readConvr(result.targetId))
          store.commit('update_convrs', store.getters.convrs)
        })
      } // new targets
      {
        // message+sender
      }

      caches.set(keys.chats, chats)
      state.chats = chats
    }
  }
})

export default store

export const login = function ({ mobile, password })
{
  return ds.login({ mobile, password }).then(myInfo =>
  {
    msgStorage = new MessageStorage(myInfo.id)
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
  msgStorage = null
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

export const addFriend = (mobile) => ds.addFriend(mobile).then(friend => appendFriend(friend)) // 加Friend可以不用调appendFriend，因为会有消息
export const addGroup = (name, membersId) => ds.addGroup({ name, membersId }).then(group => appendGroup(group)) // 加群可以不用调appendGroup，因为会有消息

const replaceConvr = function (convr)
{
  if (!convr) return
  let list = store.getters.convrs
  list = list.filter(t => t.targetId !== convr.targetId)
  list.unshift(convr)
  store.commit('update_convrs', list)
}
export const removeConvr = function (targetId)
{
  return msgStorage.removeConvr(targetId).then(() =>
  {
    store.commit('update_convrs', store.getters.convrs.filter(t => t.targetId !== targetId))
    const chats = store.getters.chats
    if (chats[targetId])
    {
      chats[targetId].message = []
      store.commit('update_chats', chats)
    }
  })
}

/**
 * 追加消息
 * @param {[]} messages
 */
const appendMessagesToChat = function (messages)
{
  if (!messages || messages.length === 0) return
  const target = store.getters.chats[messages[0].targetId]
  if (!target) return

  target.messages = target.messages.concat(messages)
  store.commit('update_chats', store.getters.chats)
}

const saveMessage = function (msg, read)
{
  return msgStorage.saveItem(msg, read).then(({ message, convr }) =>
  {
    appendMessagesToChat([message]) // 如果是当前聊天窗口的消息，则追加到currentChatMessages
    if (convr) replaceConvr(convr)
    return { message, convr }
  })
}

const messageHandlers = {
  [MessageType.text]: (message, read) => saveMessage(message, read),
  [MessageType.image]: (message, read) => saveMessage(message, read),
  [MessageType.file]: (message, read) => saveMessage(message, read),
  [MessageType.video]: (message, read) => saveMessage(message, read),
  [MessageType.voice]: (message, read) => saveMessage(message, read),
  [MessageType.sys]: (message, read) => saveMessage(message, read),
  [MessageType.groupMsgs]: (message, read) =>
  {
    return msgStorage.saveItems(message, read).then(({ messages, convr }) =>
    {
      appendMessagesToChat(messages) // 如果是当前聊天窗口的消息，则追加到currentChatMessages
      if (convr) replaceConvr(convr)
      return { messages, convr }
    })
  },
  [MessageType.renameGroup]: (message, read) =>
  {
    return saveMessage(message, read).then(({ message, convr }) =>
    {
      if (('status' in message) && message.status !== 2)
      {
        const groups = store.getters.groups
        const group = groups.find(t => t.id === message.targetId)
        if (group)
        {
          group.name = message.content.groupName
          store.commit('update_groups', groups)
        }
      }
      return { message, convr }
    })
  }, // 修改群名称
  default: (message, read) => saveMessage(message, read),
}
const messageHandler = function (message, read)
{
  const _messageHandlers = messageHandlers[message.type] || messageHandlers.default
  return _messageHandlers(message, read)
}

export const ConnectAndListening = function ()
{
  return msger(store.getters.myInfo.id
    , (status) => store.commit('update_commStatus', status)
    , (message) =>
    {
      const read = !!store.getters.chats[message.targetId]
      return messageHandler(message, read)
    })
}

const sendMessageHandle = function (type)
{
  return function (msgObj)
  {
    const newMessage = new models.Message({
      ...msgObj,
      type,
      sendTime: new Date(),
      senderId: store.getters.myInfo,
      targetType: store.getters.friends.find(f => f.id === msgObj.targetId) ? TargetType.friend : TargetType.group,
      status: 0
    })

    return messageHandler(newMessage, true)
      .then(({ message }) => msger.send(message)) // send befor | send after
      .then(message => (delete message.status, message), message => (message.status = -1, message))
      .then(message => messageHandler(message, true))
  }
}

export const sendText = sendMessageHandle(MessageType.text)
export const sendImage = sendMessageHandle(MessageType.image)
export const sendVideo = sendMessageHandle(MessageType.video)
export const sendFile = sendMessageHandle(MessageType.file)

export const exitGroup = function (groupId)
{
  return ds.exitGroup(groupId, store.getters.myInfo.id).then(group =>
  {
    removeConvr(groupId)
    removeGroup(groupId, false)
    return group
  })
}
export const deleteGroup = function (groupId)
{
  return ds.deleteGroup(groupId).then(group =>
  {
    removeConvr(groupId)
    removeGroup(groupId)
    return group
  })
}
export const addToBlacklist = function (id)
{
  const friends = store.getters.friends
  return ds.moveToBlacklist(id).then(user =>
  {
    removeConvr(id)
    friends.splice(friends.indexOf(friends.find(t => t.id === id)), 1)
    store.commit('update_friends', friends)
    const chats = store.getters.chats
    if (chats[id])
    {
      delete chats[id]
      store.commit('update_chats', chats)
    }
    return user
  })
}
export const removeFromBlacklist = function (id)
{
  return ds.moveOutBlacklist(id).then(user =>
  {
    const friends = store.getters.friends
    friends.unshift(user)
    store.commit('update_friends', friends)
    return user
  })
}
