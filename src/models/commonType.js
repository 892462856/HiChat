export const MessageType = {
  sys: 0,
  text: 1,
  image: 2,
  video: 3,
  file: 4,
  typing: '5',
  read: '6',
  unknown: '7',
  renameGroup: '8',
  groupMsgs: '20', // 群的批量消息
  0: 'sys',
  1: 'text',
  2: 'image',
  3: 'video',
  4: 'file',
  5: 'typing',
  6: 'read',
  7: 'unknown',
  8: 'renameGroup',
  20: 'groupMsgs'
}
export const TargetType = {
  friend: 1,
  group: 2,
  1: 'friend',
  2: 'group'
}

export default {
  MessageType,
  TargetType
}
