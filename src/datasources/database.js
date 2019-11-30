import axios from 'axios'

/**
 * 创建axios实例
 * @param {(type,error)=>{}} commonErrorMonitor type(request=0,response=1)
 */
const createAxiosInstance = function (commonErrorMonitor)
{
  const instance = axios.create({
    // baseURL: 'http://test.ybapp.me/test/',
    // baseURL: 'api',
    baseURL: process.env.VUE_APP_BASEPATH,
    timeout: 1000 * 3,
    // withCredentials: true,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }
  })

  instance.interceptors.request.use((config) =>
  {
    const contentType = config.headers['Content-Type'].toLocaleLowerCase()
    if (contentType.indexOf('application/x-www-form-urlencoded') > -1)
    {
      config.data = Object.entries(config.data).map(t => `${t[0]}=${t[1]}`).join('&')
    }
    return config
  }, (error) =>
  {
    commonErrorMonitor(0, error)
    return Promise.reject(error)
  })

  instance.interceptors.response.use((response) =>
  {
    const { data } = response
    if (data.resultCode < 1)
    {
      if (data.message === '请重新登录')
      {
        commonErrorMonitor(1, data)
      }
      return Promise.reject(data) // {message: "用户不存在", resultCode: 0}
    }
    if (data.sessionId)
    {
      sessionStorage.setItem('sessionId', data.sessionId)
    }
    return data.data || data
  }, (error) =>
  {
    commonErrorMonitor(1, error)
    return Promise.reject(error)
  })

  return instance
}

export default class DataSource 
{
  constructor(commonErrorMonitor)
  {
    this.serve = createAxiosInstance(commonErrorMonitor)
  }
  login ({ mobile, password })
  {
    return this.serve.post('/login', { mobile, password })
  }
  register ({ mobile, password, name, ico, verifyCode })
  {
    return this.serve.put('/register', { mobile, password, name, ico, verifyCode })
  }
  registerVerifyCode ({ mobile })
  {
    return this.serve.get('/register/verifyCode', { mobile })
  }
  logout ()
  {
    return this.serve.post('/logout')
  }

  getFriends ()
  {
    return this.serve.get('/friend/list')
  }
  addFriend (mobile)
  {
    return this.serve.put('/friend', { mobile })
  }
  getBlacklist ()
  {
    return this.serve.post('/friend/black/list')
  }
  moveToBlacklist (id)
  {
    return this.serve.put('/friend/black', { id })
  }
  moveOutBlacklist (id)
  {
    return this.serve.delete('/friend/black', { id })
  }

  getGroups ()
  {
    return this.serve.get('/group/list')
  }
  addGroup ({ name, membersId })
  {
    return this.serve.put('/group', { name, membersId })
  }
  deleteGroup (id)
  {
    return this.serve.delete('/group', { id })
  }
  updateGroupName ({ name, id })
  {
    return this.serve.post('/group/name', { name, id })
  }
  getGroupMembers (groupId)
  {
    return this.serve.get('/groupMember/list', { groupId })
  }
  addGroupMembers (groupId, usersId)
  {
    return this.serve.put('/groupMember/list', { groupId, usersId })
  }
  removeGroupMember (groupId, userId)
  {
    return this.serve.delete('/groupMember', { groupId, userId })
  }
  exitGroup (groupId, userId)
  {
    return this.serve.post('/groupMember/exit', { groupId, userId })
  }
  updateGroupUserName ({ groupId, userId, userName })
  {
    return this.serve.post('/groupMember/userName', { groupId, userId, userName })
  }

  getUsers (ids)
  {
    if (ids.length === 0) return Promise.resolve([])
    return this.serve.get('/user/list/byIds', { ids })
  }
  getUserByMobile (mobile)
  {
    return this.serve.get('/user/byMobile', { mobile })
  }
  updateUserIco ({ id, ico })
  {
    return this.serve.post('/user/ico', { id, ico })
  }
  updateUserName ({ id, name })
  {
    return this.serve.post('/user/name', { id, name })
  }
  updateMobile ({ id, mobile, verifyCode })
  {
    return this.serve.post('/user/mobile', { id, mobile, verifyCode })
  }
  updatePassword ({ id, oldPwd, newPwd })
  {
    return this.serve.post('/user/password', { id, oldPwd, newPwd })
  }
  updatePasswordByMobile ({ mobile, verifyCode, newPwd })
  {
    return this.serve.post('/user/password/byMobile', { mobile, verifyCode, newPwd })
  } // 忘记密码,通过手机号找回
  getMobileVerifyCode ({ mobile })
  {
    return this.serve.get('/user/mobile/verifyCode', { mobile })
  }

  /**
   * 上传文件,返回{thumbnail:'base64,url:''}
   * @param {*} formData file
   * @param {*} param1 fileType('img'|'video'|'-')
   */
  uploadFile (formData, { requireThumbnail = false, fileType })
  {
    return this.serve.put(`/uploadFile?fileType=${fileType}&requireThumbnail=${requireThumbnail}`,
      formData,
      {
        timeout: 10000,
        headers: { 'Content-Type': 'multipart/form-data; charset=UTF-8' }
      })
  }
}
