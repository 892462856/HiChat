import { uuid } from '@/assets/js/common'

const User = function ({ id, name, mobile, ico })
{
  this.id = id
  this.name = name
  // this.password = password
  this.mobile = mobile
  this.ico = ico
}

const Friend = function ({ userId, friendId, isBlacked })
{
  this.userId = userId
  this.friendId = friendId
  this.isBlacked = isBlacked
}

const Group = function ({ id, name, ico, isDeleted })
{
  this.id = id
  this.name = name
  this.ico = ico
  this.isDeleted = isDeleted || false
}
const GroupMember = function ({ groupId, userId, userName, isOwner, isAdmin })
{
  this.groupId = groupId
  this.userId = userId
  this.userName = userName
  this.isOwner = isOwner || false
  this.isAdmin = isAdmin || false
}

const Message = function ({ id, cid, type, senderId, targetId, targetType, content, callList, sentTime })
{
  this.id = id
  this.cid = cid || uuid()
  this.type = type
  this.senderId = senderId
  this.targetId = targetId
  this.targetType = targetType
  this.content = content
  this.callList = callList
  // this.readTime = readTime
  this.sentTime = sentTime
  // this.receiveTime = receiveTime
}

const Convr = function ({
  targetId,
  targetType,
  senderId,
  sentTime,
  receivedTime,
  unreadCount,
  latestMessage: { id, cid, type, content, callList = [] }
})
{
  this.targetId = targetId
  this.targetType = targetType
  this.senderId = senderId
  this.sentTime = sentTime
  this.receivedTime = receivedTime
  this.unreadCount = unreadCount
  this.latestMessage = { id, cid, type, content, callList }
}


const GetContentSketchByMessageContent = function (msg)
{
  let str = ''
  if ((msg.callList || []).length > 0)
  {
    str = '[call你]'
  }
  switch (msg.type)
  {
    case 'text':
      return `${str}${msg.content.content}`
    case 'image':
      return `${str}[图片]`
    case 'video':
      return `${str}[视频]`
    case 'file':
      return `${str}[文件]`
    case 'voice':
      return `${str}[语音]`
    case 'HQVoice':
      return `${str}[图片]`
    case 'sys':
      return `${str}${msg.content.content}`
    default:
      return `${str}……`
  }
}

const MessageToConvr = function (msg, read = false)
{
  return new Convr({
    targetId: msg.targetId,
    targetType: msg.targetType,
    senderId: msg.senderId,
    sentTime: msg.sentTime,
    receivedTime: msg.receivedTime,
    unreadCount: read ? 0 : 1,
    latestMessage: {
      id: msg.id,
      cid: msg.cid,
      type: msg.type,
      callList: msg.callList,
      content: GetContentSketchByMessageContent(msg)
    }
  })
}


export default {
  User,
  Friend,
  Group,
  GroupMember,
  Message,
  Convr,
  MessageToConvr
}
