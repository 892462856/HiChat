import localforage from 'localforage'
import messager from '@/datasources/message'
import { MessageConvertToConversation } from '@/models'

localforage.config({
  // driver: localforage.WEBSQL, // 使用 WebSQL；也可以使用 setDriver()
  name: 'hiChat',
  version: 1.0,
  // size: 4980736, // 数据库的大小，单位为字节。现仅 WebSQL 可用
  storeName: 'keyvaluepairs', // 仅接受字母，数字和下划线
  description: 'hiChat web cache storage'
})

class ConvrStorage
{
  constructor(userId)
  {
    this._key = `convr_${userId}`
    this._cache = localforage // window.localStorage
  }
  get ()
  {
    return this._cache.getItem(this._key)
  }
  remove ()
  {
    return this.get().then(storage =>
    {
      return this._cache.removeItem(this._key).then(() => storage)
    })
  }
  save (storage)
  {
    return this._cache.setItem(this._key, storage)
  }
  getItem (targetId)
  {
    return this.get().then(storage =>
    {
      const item = storage.find(t => t.targetId === targetId)
      return { storage, item }
    })
  }
  addItem (item)
  {
    const { targetId } = item
    return this.getItem(targetId).then(({ storage, item: oldItem }) =>
    {
      if (oldItem)
      {
        if (item.unreadCount !== 0)
        {
          item.unreadCount = oldItem.unreadCount + 1
        }
        storage.splice(storage.indexOf(oldItem), 1)
      }
      storage.unshift(item)
      storage.sort((a, b) => a.sendTime - b.sendTime)
      this.save(storage)
      return item
    })
  }
  updateItem (targetId, updater)
  {
    return this.getItem(targetId).then(({ storage, item }) =>
    {
      if (item)
      {
        updater(item) // 一般不改sendTime,bu yong sort
        return this.save(storage).then(() => item)
      }
      return item
    })
  }
  removeItem (targetId)
  {
    return this.getItem(targetId).then(({ storage, item }) =>
    {
      if (!item) return item
      storage.splice(storage.indexOf(item), 1)
      return this.save(storage).then(() => item)
    })
  }
}

class MessageStorage 
{
  constructor(userId, onStatusChange, receiver)
  {
    this._cache = localforage
    this._userId = userId
    this._key = `msg_${userId}`
    this._cStorage = new ConvrStorage(userId) // 会话是根据消息来的
    this._msger = new messager(userId, (msg) =>
    {
      console.log(msg)
    })
  }
  _getFullKey (targetId)
  {
    return `${this._key}_${targetId}`
  }
  get (targetId)
  {
    const storage = JSON.parse(this._cache.getItem(this._getFullKey(targetId))) || []
    return Promise.resolve(storage)
  }
  remove (targetId)
  {
    return this.get(targetId).then((storage) =>
    {
      this._cache.removeItem(this._getFullKey(targetId))
      return storage
    })
  }
  save (storage, targetId)
  {
    this._cache.setItem(this._getFullKey(targetId), JSON.stringify(storage))
    return Promise.resolve()
  }
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
  }
  removeItem (msg)
  {
    return this.get(msg.targetId).then((storage) =>
    {
      storage = storage.filter(t => t.messageUId !== msg.messageUId)
      this.save(storage, msg.targetId)
      return msg
    })
  }

  _onSent (msg)
  {
    return this._saveItem(msg)
  }
  sendText ({ content, extra, sender, target })
  {
    return this._msger(target).sendText({ content, extra }).then((message) =>
    {
      message.senderUser = sender
      message.target = target
      return this._onSent(message)
    })
  }
  sendImage ({ content, imageUri, sender, target })
  {
    return this._msger(target).sendImage({ content, imageUri }).then((message) =>
    {
      message.senderUser = sender
      message.target = target
      return this._onSent(message)
    })
  }
  sendFile ({ name, fileUrl, extra, type, size, sender, target })
  {
    return this._msger(target).sendFile({ name, fileUrl, extra, type, size }).then((message) =>
    {
      message.senderUser = sender
      message.target = target
      return this._onSent(message)
    })
  }
  _onReceived (msg, read)
  {
    return this._saveItem(msg, read)
  }
  receiveText (msg, read)
  {
    return this._onReceived(msg, read)
  }
  receiveImage (msg, read)
  {
    return this._onReceived(msg, read)
  }
  receiveFile (msg, read)
  {
    return this._onReceived(msg, read)
  }
  receiveHQVoice (msg, read)
  {
    return this._onReceived(msg, read)
  }
  receiveRichContent (msg, read)
  {
    return this._onReceived(msg, read)
  }
  receiveGroupNotification (msg, read)
  {
    return this._onReceived(msg, read)
  }

  getConversations ()
  {
    return this._cStorage.get()
  }
  updateConversation (targetId, updater)
  {
    this._cStorage.updateItem(targetId, updater)
  }
  removeConversation (targetId)
  { // conversationType, targetId
    this.remove(targetId) // 先删除消息
    return this._cStorage.removeItem(targetId) // 删除会话
  }
}

export default MessageStorage
