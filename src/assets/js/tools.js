const cursorHander = {
    insertAtCursorForText(textEl, text) {
        // debugger
        const el = textEl
        // IE support
        if (document.selection) {
            textEl.focus()
            const sel = document.selection.createRange()
            sel.text = text
        } else if (textEl.selectionStart || textEl.selectionStart === '0') {
            // MOZILLA and others
            const startPos = textEl.selectionStart
            const endPos = textEl.selectionEnd
            el.value = `${el.value.substring(
                0,
                startPos
            )}${text}${el.value.substring(endPos, el.value.length)}`
        } else {
            // el.innerText = text
            el.value += text
        }
    },
    /**
     * 插入内容到光标位置
     * @param {要插入的内容} html
     * @param {光标+剪贴板} selection
     */
    pasteHtmlAtCaret(html, selection = null) {
        if (window.getSelection) {
            // IE9 and non-IE
            const sel = selection || window.getSelection()
            if (sel.getRangeAt && sel.rangeCount) {
                let range = sel.getRangeAt(0)
                range.deleteContents()

                // Range.createContextualFragment() would be useful here but is
                // only relatively recently standardized and is not supported in
                // some browsers (IE9, for one)
                const el = document.createElement('div')
                el.innerHTML = html
                const frag = document.createDocumentFragment()
                let node = el.firstChild
                let lastNode = null
                while (node) {
                    lastNode = frag.appendChild(node)
                    node = el.firstChild
                }
                range.insertNode(frag)

                // Preserve the selection
                if (lastNode) {
                    range = range.cloneRange()
                    range.setStartAfter(lastNode)
                    range.collapse(true)
                    sel.removeAllRanges()
                    sel.addRange(range)
                }
            }
        } else if (document.selection && document.selection.type !== 'Control') {
            // IE < 9
            document.selection.createRange().pasteHTML(html)
        }
    },
    /**
     * 设置光标位置 在el/或el之后
     * @param {focusNode} el
     * @param {focusOffset} offset
     */
    setCursorAt(el, offset) {
        const sel = document.getSelection()
        let range = sel.getRangeAt(0)
        range.deleteContents()
        range = range.cloneRange()
        if (typeof (offset) === 'number') {
            range.setStart(el, offset)
        } else {
            range.setStartAfter(el)
        }

        range.collapse(true)
        sel.removeAllRanges()
        sel.addRange(range)
    }
}
const htmlHander = {
    toText(oldStr) {
        if (oldStr === null || oldStr === undefined || oldStr === '') return ''
        let str = oldStr
        str = str.replace(/<br\/>/g, '\n')
        str = str.replace(/<br>/g, '\n')
        str = str.replace(/&nbsp;/g, '   ')
        str = str.replace(/&lt;/g, '<')
        str = str.replace(/&gt;/g, '>')
        str = str.replace(/&nbsp;&nbsp;&nbsp;/g, '\t')
        str = str.replace(/&quot;/g, '"')
        return str
    },
    toText2(html) {
        const div = document.createElement('div')
        div.innerHTML = html.replace(/<br>/g, '\r\n')
        return div.innerText.trim()
    },
    toHtml(oldStr) {
        if (oldStr === null || oldStr === undefined || oldStr === '') return ''
        let str = oldStr
        str = str.replace(/ /g, '&nbsp;')
        str = str.replace(/</g, '&lt;')
        str = str.replace(/>/g, '&gt;')
        str = str.replace(/\n/g, '<br/>')
        str = str.replace(/\t/g, '&nbsp;&nbsp;&nbsp;')
        str = str.replace(/"/g, '&quot;')
        return str
    }
}

const dateHander = {
    clearSsecond(str) {
        return str
            .split('')
            .reverse()
            .join('')
            .substr(3)
            .split('')
            .reverse()
            .join('')
    },
    remind(time) {
        const today = new Date()
        const todayStr = today.toDateString()
        const timeStr = dateHander.clearSsecond(time.toLocaleTimeString()) // 去掉 秒

        if (todayStr === time.toDateString()) {
            return timeStr
        }
        if (todayStr === new Date(time.setDate(time.getDate() + 1)).toDateString()) {
            return `昨天 ${timeStr}`
        }
        return dateHander.clearSsecond(time.toLocaleString())
    }
}

const blobHander = {
    /**
     * dataURL to blob
     * @param {*} dataurl
     */
    dataURLtoBlob(dataurl) {
        const arr = dataurl.split(',')
        const mime = arr[0].match(/:(.*?);/)[1]
        const bstr = atob(arr[1])
        let n = bstr.length
        const u8arr = new Uint8Array(n)
        while (n) {
            n -= 1
            u8arr[n] = bstr.charCodeAt(n)
        }
        return new Blob([u8arr], { type: mime })
    },
    /**
     * blob to dataURL
     * @param {*} blob
     * @param {*} callback
     */
    blobToDataURL(blob, callback) {
        const a = new FileReader()
        a.onload = function (e) { callback(e.target.result) }
        a.readAsDataURL(blob)
    }
}

/**
const popup = {
    confirm(title, content) {
        var box = document.createElement("div")
        var titleBox = document.createElement("div")
        var contentBox = document.createElement("div")
        var bottonBox = document.createElement("div")
        var okButton = document.createElement("button")
        var cancelButton = document.createElement("button")

        let titleText = document.createTextNode(title)
        let contentText = document.createTextNode(content)

        box.className = 'tools-popup'
        titleBox.className = 'tools-popup-title'
        contentBox.className = 'tools-popup-content'
        bottonBox.className = 'tools-popup-botton'
        okButton.className = 'tools-popup-botton-okButton'
        cancelButton.className = 'tools-popup-botton-cancelButton'

        titleBox.appendChild(titleText)
        contentBox.appendChild(contentText)

        bottonBox.appendChild(okButton)
        bottonBox.appendChild(cancelButton)

        box.appendChild(titleBox)
        box.appendChild(contentBox)
        box.appendChild(bottonBox)

        document.body.appendChild(box)
    }
}
*/

export default cursorHander
export const curser = cursorHander
export const htmler = htmlHander
export const timer = dateHander
export const blober = blobHander
