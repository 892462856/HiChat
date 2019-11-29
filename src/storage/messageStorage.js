import { conversationApi, MessagesApi } from '@/dataAccessor/RongApi'
import { MessageConvertToConversation } from '@/assets/js/Types'

/**
 * 我的会话列表存储管理器
 * @param {*} userId 我的ID
 */
function ConversationStorage (userId)
{
  this._key = `conversationStorage_${userId}`
  this._cache = window.localStorage
  this._serverApi = conversationApi
}
ConversationStorage.prototype = {
  get ()
  {
    const list = JSON.parse(this._cache.getItem(this._key))
    if (!list)
    {
      return this._serverApi.getList(null, 100000).then(data =>
      {
        // if (data.length === 0) return Promise.resolve([])
        data = [] // 暂时不要rong的会话，因为未开通rong的历史消息 功能，拿不到消息，只有会话没用
        return this.save(data)
      })
    }
    return Promise.resolve(list)
  },
  remove ()
  {
    return this.get().then((storage) =>
    {
      this._cache.removeItem(this._key)
      return storage
    })
  },
  save (storage)
  {
    this._cache.setItem(this._key, JSON.stringify(storage))
    return Promise.resolve(storage)
  },
  getItem (targetId)
  {
    return this.get().then(storage =>
    {
      // const item = storage.find(t => t.conversationType === conversationType && t.targetId === targetId)
      const item = storage.find(t => t.targetId === targetId)
      return { storage, item }
    })
  },
  addItem (item)
  {
    const { targetId } = item
    return this.getItem(targetId).then(({ storage, item: oldItem }) =>
    {
      if (oldItem)
      {
        if (item.unreadMessageCount !== 0)
        {
          item.unreadMessageCount = oldItem.unreadMessageCount + 1
        }
        storage.splice(storage.indexOf(oldItem), 1)
      }
      storage.unshift(item)
      this.save(storage)
      return item
    })
  },
  updateItem (targetId, updater)
  {
    this.get().then(list =>
    {
      const item = list.find(t => t.targetId === targetId)
      if (item)
      {
        updater(item)
        this.save(list)
      }
    })
  },
  removeItem (targetId)
  { // conversationType, targetId
    return this.getItem(targetId).then(({ storage, item }) =>
    {
      if (!item) return item
      storage.splice(storage.indexOf(item), 1)
      this.save(storage)
      this._serverApi.removeOneBy(item.conversationType, targetId)
      return item
    })
  }
}

/**
 * 我的消息存储管理器
 * @param {*} userId 我的ID
 * @param {*} target1 打开的聊天窗口target：好友/群
 */
function MessageStorage (userId)
{
  // debugger
  if (!userId) return null
  this._cache = window.localStorage
  this._userId = userId
  this._key = `messageStorage_${userId}`
  this._cStorage = new ConversationStorage(userId) // 会话是根据消息来的
}
MessageStorage.prototype = {
  _msger (target)
  {
    return new MessagesApi(target.conversationType, target.targetId)
  },
  _getFullKey (targetId)
  {
    return `${this._key}_${targetId}` // 一个target存储一个localStorage
  },
  get (targetId)
  {
    const storage = JSON.parse(this._cache.getItem(this._getFullKey(targetId))) || []
    return Promise.resolve(storage)
  },
  remove (targetId)
  {
    return this.get(targetId).then((storage) =>
    {
      this._cache.removeItem(this._getFullKey(targetId))
      return storage
    })
  },
  save (storage, targetId)
  {
    this._cache.setItem(this._getFullKey(targetId), JSON.stringify(storage))
    return Promise.resolve()
  },
  /**
   * 保存+更新会话。return后{message消息,convr会话}
   * @param {*} msg
   */
  _saveItem (msg, read = true)
  {
    return this.get(msg.targetId).then((storage) =>
    {
      const senderUser = msg.senderUser
      const target = msg.target
      delete msg.senderUser
      delete msg.target
      if (senderUser)
      {
        msg.senderUserName = senderUser.name
        msg.senderUserIco = senderUser.ico
      }

      storage.push(msg)
      this.save(storage, msg.targetId)

      const convr = MessageConvertToConversation(msg, read)
      this._cStorage.addItem(convr)

      return { message: msg, convr, senderUser, target }
    })
  },
  removeItem (msg)
  {
    return this.get(msg.targetId).then((storage) =>
    {
      storage = storage.filter(t => t.messageUId !== msg.messageUId)
      this.save(storage, msg.targetId)
      return msg
    })
  },

  _onSent (msg)
  {
    return this._saveItem(msg)
  },
  sendText ({ content, extra, sender, target })
  {
    return this._msger(target).sendText({ content, extra }).then((message) =>
    {
      message.senderUser = sender
      message.target = target
      return this._onSent(message)
    })
  },
  sendEncryptText ({ content, extra, sender, target })
  {
    return this._msger(target).sendEncryptText({ content, extra }).then((message) =>
    {
      message.senderUser = sender
      message.target = target
      return this._onSent(message)
    })
  },
  sendImage ({ content, imageUri, sender, target })
  {
    return this._msger(target).sendImage({ content, imageUri }).then((message) =>
    {
      message.senderUser = sender
      message.target = target
      return this._onSent(message)
    })
  },
  sendFile ({ name, fileUrl, extra, type, size, sender, target })
  {
    return this._msger(target).sendFile({ name, fileUrl, extra, type, size }).then((message) =>
    {
      message.senderUser = sender
      message.target = target
      return this._onSent(message)
    })
  },
  _onReceived (msg, read)
  {
    return this._saveItem(msg, read)
  },
  receiveText (msg, read)
  {
    return this._onReceived(msg, read)
  },
  receiveImage (msg, read)
  {
    return this._onReceived(msg, read)
  },
  receiveFile (msg, read)
  {
    return this._onReceived(msg, read)
  },
  receiveHQVoice (msg, read)
  {
    return this._onReceived(msg, read)
  },
  receiveRichContent (msg, read)
  {
    return this._onReceived(msg, read)
  },
  receiveGroupNotification (msg, read)
  {
    return this._onReceived(msg, read)
  },
  receiveTypingStatus ()
  {
    return Promise.resolve({ message: null, convr: null, senderUser: null, target: null })
  },
  receiveReadReceipt ()
  {
    return Promise.resolve({ message: null, convr: null, senderUser: null, target: null })
  },
  receiveUnknown ()
  {
    return Promise.resolve({ message: null, convr: null, senderUser: null, target: null })
  },
  receiveOther ()
  {
    return Promise.resolve({ message: null, convr: null, senderUser: null, target: null })
  },

  /**
   * 获取 会话列表
   */
  getConversations ()
  {
    return this._cStorage.get()
  },
  /**
   * 修改一个会话
   * @param {String} targetId
   * @param {Function} updater 修改函数
   */
  updateConversation (targetId, updater)
  {
    this._cStorage.updateItem(targetId, updater)
  },
  /**
   * 移除一个会话
   * @param {*} conversationType
   * @param {*} targetId
   */
  removeConversation (targetId)
  { // conversationType, targetId
    this.remove(targetId) // 先删除消息
    return this._cStorage.removeItem(targetId) // 删除会话
  }
}

export default MessageStorage
