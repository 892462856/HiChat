import axios from 'axios'
import { GetTarget, GetGroupMember } from '@/assets/js/Types'

const instance = axios.create({
    // baseURL: 'http://test.ybapp.me/test/',
    // baseURL: 'api',
    baseURL: window.rootPath || process.env.VUE_APP_BASEPATH,
    timeout: 1000 * 10,
    // withCredentials: true,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }
})

/**
 * axios请求error监听器
 * @param {Number} type request=0,response=1
 * @param {*} error
 */
let errorMonitor = (type, error) => {
    console.log(type, error)
}

instance.interceptors.request.use((config) => {
    const contentType = config.headers['Content-Type'].toLocaleLowerCase()
    if (contentType.indexOf('application/x-www-form-urlencoded') > -1) {
        config.data = Object.entries(config.data).map(t => `${t[0]}=${t[1]}`).join('&')
    }
    return config
}, (error) => {
    errorMonitor(0, error)
    return Promise.reject(error)
})

instance.interceptors.response.use((response) => {
    const { data } = response
    if (data.resultCode < 1) {
        if (data.message === '请重新登录') {
            errorMonitor(1, data)
        }
        return Promise.reject(data) // {message: "用户不存在", resultCode: 0}
    }
    if (data.sessionId) {
        sessionStorage.setItem('sessionId', data.sessionId)
    }
    return data.data || data
}, (error) => {
    errorMonitor(1, error)
    return Promise.reject(error)
})

const getSessionId = () => sessionStorage.getItem('sessionId')

const operate = {
    setCommonErrorMonitor(func) {
        errorMonitor = func
    },
    login({ name, password, region }) {
        return instance.post('f/login', { username: name, password, region, deviceType: '3' }).then(user => GetTarget(user))
    },
    register({ telephone, password, name, fileContent, deviceId, activeCode, deviceType, region, extention, logoName }) {
        return instance.post('f/register2', { telephone, userName: telephone, password, nickName: name, fileContent, deviceId, activeCode, deviceType, region, extention, logoName })
    },
    registerVerifyCode({ telephone, region }) {
        return instance.post('f/registerMessage', { telephone, region })
    },
    logout({ telephone }) {
        return instance.post('f/logout', { userName: telephone, sessionId: getSessionId() })
    },
    logouted() {
        sessionStorage.removeItem('sessionId')
    },

    getFriends() {
        return instance.post('f/getUserFriend', { sessionId: getSessionId() }).then(data => {
            let list = data instanceof Array ? data : []
            list = list.map(t => GetTarget(t))
            return list
        })
    },
    getGroups() {
        return instance.post('f/getUserGroup', { sessionId: getSessionId() }).then(data => {
            let list = data instanceof Array ? data : []
            list = list.map(t => GetTarget(t))
            return list
        })
    },
    searchUser(keyword) {
        return instance.post('f/searchChatUser', { key: keyword, pageSize: 100, pageIndex: 1 }).then(data => {
            if (data && data.list) {
                data.list = data.list.map(t => GetTarget(t))
            }
            return data
        })
    },
    getUsersByTargetId(targetIds) {
        if (targetIds.length === 0) return Promise.resolve([])

        const xmppUserNames = targetIds.join(',')
        return instance.post('f/getUserByXmpps', { sessionId: getSessionId(), xmppUserNames }).then(data => (data instanceof Array ? data : []).map(t => GetTarget(t)))
    },
    addFriend(telephone) {
        return instance.post('f/addFriend', { sessionId: getSessionId(), userName: telephone }).then(user => GetTarget(user))
    },
    setBlackUserPwd(blackPWD) {
        return instance.post('f/setBlackUserPwd', { sessionId: getSessionId(), blackPWD })
    },
    getBlackUsers(blackPWD) {
        return instance.post('f/findBlackUser', { sessionId: getSessionId(), blackPWD }).then(data => (data instanceof Array ? data : []).map(t => GetTarget(t)))
    },
    addBlckUser(userIds) {
        return instance.post('f/addBlckUser', { sessionId: getSessionId(), userIds: userIds.join(',') })
    },
    delBlckUser(userIds) {
        return instance.post('f/delBlckUser', { sessionId: getSessionId(), userIds: userIds.join(',') })
    },
    /**
     * 创建群
     * @param {{ids:String[] }} param0
     */
    addGroup({ ids }) {
        return instance.post('f/addGroup', { sessionId: getSessionId(), ids: ids.join(',') }).then(group => GetTarget(group))
    },
    updateGroupName({ name, id }) {
        return instance.post('f/updateGroupName', { sessionId: getSessionId(), naturalName: name, roomId: id })
    },
    getGroupMembers(groupId) {
        return instance.post('f/getRoomUser', { sessionId: getSessionId(), roomId: groupId }).then(data => {
            const members = data instanceof Array ? data : []
            return members.map(t => GetGroupMember(t))
        })
    },
    addGroupMember(groupId, userIds) {
        return instance.post('f/addUserToGroup', { groupId, ids: userIds })
    },
    removeGroupMember(groupId, userId) {
        return instance.post('f/removeRoomMeber', { sessionId: getSessionId(), roomId: groupId, ids: userId })
    },
    updateGroupUserName({ groupId, userName }) {
        return instance.post('f/updateGroupUserName', { sessionId: getSessionId(), roomId: groupId, nickName: userName })
    }, // 修改我在群中的名称
    exitGroup(targetId) {
        return instance.post('f/exitRoom', { sessionId: getSessionId(), roomName: targetId })
    },
    deleteGroup(targetId) {
        return instance.post('f/delGroup', { sessionId: getSessionId(), roomName: targetId })
    },
    setGroupCast(targetId, userTelephone) {
        return instance.post('f/setRoomCast', { sessionId: getSessionId(), roomName: targetId, userName: userTelephone })
    },

    uploadFile(formData, { generatePic, isVideo, extention } = {}) { // , { generatePic = 1, isVideo } = {}
        // return instance.post(`5436/fileupload.ashx?sessionId=${getSessionId()}&extention=${extention}${isVideo === 1 ? '&isVideo=1' : ''}${generatePic === 1 ? '&generatePic=1' : ''}`,
        // return instance.post(`jeesite/f/postUploadFiles?gBase64=1&sessionId=${getSessionId()}&extention=${extention}${isVideo === 1 ? '&isVideo=1' : ''}${generatePic === 1 ? '&generatePic=1' : ''}`,
        return instance.post(`f/postUploadFiles?gBase64=1&sessionId=${getSessionId()}&extention=${extention}${isVideo === 1 ? '&isVideo=1' : ''}${generatePic === 1 ? '&generatePic=1' : ''}`,
            formData,
            {
                timeout: 10000,
                headers: { 'Content-Type': 'multipart/form-data; charset=UTF-8' }
            })
    },

    changeUserDetail({ telephone, nickName, fileContent, ex }) {
        return instance.post('f/changeUserDetail', { sessionId: getSessionId(), userName: telephone, nickName, fileContent, ex })
    },
    changeUserDetail2(formData, { telephone, nickName, ex }) {
        return instance.post(`f/changeUserDetail?sessionId=${getSessionId()}&userName=${telephone}&nickName=${nickName}&ex=${ex}`,
            formData,
            {
                timeout: 10000,
                headers: { 'Content-Type': 'multipart/form-data; charset=UTF-8' }
            })
    },
    updateUserName({ telephone, activeCode, region }) {
        return instance.post('f/updateUserName', { sessionId: getSessionId(), userName: telephone, activeCode, region })
    },
    changeTelMessage({ telephone, region }) {
        return instance.post('f/changeTelMessage', { sessionId: getSessionId(), userName: telephone, region })
    },
    changPwd({ oldPwd, newPwd }) {
        return instance.post('f/changPwd', { sessionId: getSessionId(), oldPwd, newPwd })
    },
    saveForgetPWD({ telephone, activeCode, newPwd }) {
        return instance.post('f/SaveForgetPWD', { telephone, activeCode, newPwd })
    },
    forgetPWDMessage(telephone) {
        return instance.post('f/forgetPWDMessage', { telephone })
    }
}

export default operate
