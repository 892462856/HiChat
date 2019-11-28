// const AES = require('crypto-js/aes')
// const SHA256 = require('crypto-js/sha256')
const CryptoJS = require('crypto-js')

function getAesString(data, key_, iv_) { // 加密
    const key = CryptoJS.enc.Utf8.parse(key_)
    const iv = CryptoJS.enc.Utf8.parse(iv_)
    const encrypted = CryptoJS.TripleDES.encrypt(data, key,
        {
            iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        })
    return encrypted.toString() // 返回的是base64格式的密文
}
function getDAesString(encrypted, key_, iv_) { // 解密
    const key = CryptoJS.enc.Utf8.parse(key_)
    const iv = CryptoJS.enc.Utf8.parse(iv_)
    const decrypted = CryptoJS.TripleDES.decrypt(encrypted, key,
        {
            iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        })
    return decrypted.toString(CryptoJS.enc.Utf8)
}

function getAES(data) { // 加密
    const key = 'wocao911678!@Dgnilaoerw2rtetertrewr' // 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' // 密钥
    const iv = '87654321' // '1234567812345678'
    const encrypted = getAesString(data, key, iv) // 密文
    // const encrypted1 = CryptoJS.enc.Utf8.parse(encrypted)
    return encrypted
}

function getDAes(data) { // 解密
    const key = 'wocao911678!@Dgnilaoerw2rtetertrewr' // 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' // 密钥
    const iv = '87654321' // '1234567812345678'
    const decryptedStr = getDAesString(data, key, iv)
    return decryptedStr
}

export {
    CryptoJS as default,
    getAES,
    getDAes
}
