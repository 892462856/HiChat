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

export default {
  User,
  Friend,
  Group,
  GroupMember,
  Message
}
