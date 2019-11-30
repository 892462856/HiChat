import localforage from 'localforage'
// import messager from '../datasources/message'
import { MessageToConvr } from '@/models'

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
    return this._cache.getItem(this._key).then(list => list || [])
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
  constructor(userId)
  {
    if (!userId) return null
    this._cache = localforage
    this._userId = userId
    this._key = `msg_${userId}`
    this._cStorage = new ConvrStorage(userId) // 会话是根据消息来的
  }
  _fullKey (targetId)
  {
    return `${this._key}_${targetId}`
  }
  get (targetId)
  {
    return this._cache.getItem(this._fullKey(targetId)).then(list => list || [])
  }
  remove (targetId)
  {
    return this.get(targetId).then((storage) =>
    {
      return this._cache.removeItem(this._fullKey(targetId)).then(() => storage)
    })
  }
  save (storage, targetId)
  {
    return this._cache.setItem(this._fullKey(targetId), storage)
  }
  /**
   * 保存+更新会话。return后{message消息,convr会话}
   * @param {*} msg
   */
  saveItem (msg, read = true)
  {
    return this.get(msg.targetId).then((storage) =>
    {
      const index = storage.findIndex(t => t.cid === msg.cid)
      if (index > -1) storage.splice(index, 1)

      storage.push(msg)
      const convr = MessageToConvr(msg, read)
      return Promise.all(this.save(storage, msg.targetId), this._cStorage.addItem(convr))
        .then(([, convr_]) =>
        {
          return { message: msg, convr: convr_ }
        })
    })
  } // 可以未发送完 先到列表!!!
  saveItems (msgs, read = false)
  {
    const msg = msgs.shift()
    return this.get(msg.targetId)
      .then((storage) => this.save(storage.concat(msgs), msg.targetId))
      .then(() => this.saveItem(msg, read))
      .then(msgWithConvr =>
      {
        if (!read)
        {
          return this._cStorage.updateItem(msg.targetId, convr =>
          {
            convr.unreadCount = convr.unreadCount + msgs.length
          }).then(convr => ({ message: msgWithConvr.message, convr, messages: msgs }))
        }
        return { message: msgWithConvr.message, convr: msgWithConvr.convr, messages: msgs }
      })
  }
  removeItem (msg)
  {
    return this.get(msg.targetId).then((storage) =>
    {
      storage = storage.filter(t => t.id !== msg.id)
      return this.save(storage, msg.targetId).then(() => msg)
    })
  }

  getConvrs ()
  {
    return this._cStorage.get()
  }
  updateConvr (targetId, updater)
  {
    return this._cStorage.updateItem(targetId, updater)
  }
  readConvr (targetId)
  {
    return this._cStorage.updateItem(targetId, convr =>
    {
      convr.unreadCount = 0
    })
  }
  removeConvr (targetId)
  {
    return this.remove(targetId) // 先删除消息
      .then(() => this._cStorage.removeItem(targetId)) // 删除会话
  }
}

export default MessageStorage
