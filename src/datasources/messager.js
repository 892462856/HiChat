/**
 * 链接成功后才执行execute
 * @param {(resolve:(result)=>{}, reject:(error)=>{})=>{}} execute
 */
function PromiseAfterConnected (status, execute) 
{
  return new Promise((resolve, reject) => 
  {
    if (status.code === 1) 
    {
      execute(resolve, reject)
    }
    else 
    {
      let n = null
      n = setInterval(() => 
      {
        if (status.code === 1) 
        {
          clearInterval(n)
          execute(resolve, reject)
        }
      }, 100)
    }
  })
}
// reconnect disconnect logout
// const errorCodePair = {
//   [RongIMLib.ErrorCode.TIMEOUT]: '超时',
//   [RongIMLib.ErrorCode.UNKNOWN]: '未知错误',
//   [RongIMLib.ErrorCode.REJECTED_BY_BLACKLIST]: '在黑名单中，无法向对方发送消息',
//   [RongIMLib.ErrorCode.NOT_IN_DISCUSSION]: '不在讨论组中',
//   [RongIMLib.ErrorCode.NOT_IN_GROUP]: '不在群组中',
//   [RongIMLib.ErrorCode.NOT_IN_CHATROOM]: '不在聊天室中'
// }

const connect = function (identify, onStatusChange, receiver)
{
  const socket = new WebSocket(`ws://172.16.0.13:8001/${identify}`)
  onStatusChange(0, socket)

  socket.addEventListener('message', function (event)    
  {
    console.log(event.data)
    receiver(event.data)
  })

  socket.addEventListener('open', function ()    
  {
    onStatusChange(1)
    console.log(`open:${identify}`)
    // socket.send(`open:${identify}`)      
  })
  socket.addEventListener('close', function ()    
  {
    onStatusChange(-1)
    console.log(`close:${identify}`)
  })
  socket.addEventListener('error', function ()    
  {
    onStatusChange(-2)
    console.log(`error:${identify}`)
    connect(identify, onStatusChange, receiver) // reconnect
  })
}

const statusStrings = {
  '0': '链接中……',
  '1': '链接成功',
  '-1': '链接已关闭',
  '-2': '链接失败'
}

export class Messager
{
  constructor(identify, onStatusChange, receiver)
  {
    if (!identify) return null
    connect(identify, (status, socket) =>
    {
      this.status = { code: status, str: statusStrings[status] }
      this.socket = socket || this.socket
      onStatusChange({ ...this.status })
    }, receiver)
  }
  send (message)
  {
    return PromiseAfterConnected(this.status, (resolve, reject) =>
    {
      const result = this.socket.send(message)
      console.log(result)
      // 要接收一条消息，才知道是否成功
      resolve(message)
      reject(message)
    })
  }
  close ()
  {
    if (this.socket.readyState === 1)
      this.socket.close()
  }
}
