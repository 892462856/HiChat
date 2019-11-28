import Vue from 'vue'
import VueRouter from 'vue-router'

import store, { logout, LinkCommunicationAndListening, logoutState, updateLastMyWindow, updateCurrentChatTarget } from '@/stores'

import enter from '@/pages/Enter.vue'
import login from '@/pages/Login.vue'
import register from '@/pages/Register.vue'

import home from '@/pages/Home.vue'
import chatMenu from '@/pages/Submenu/ChatMenu.vue'
import friendMenu from '@/pages/Submenu/FriendMenu.vue'
import chatWindow from '@/pages/Content/ChatWindow.vue'
import myMenu from '@/pages/Submenu/MyMenu.vue'
import myInfo from '@/pages/Content/MyInfo.vue'
import myBlacklist from '@/pages/Content/Blacklist.vue'
import myLogins from '@/pages/Content/MyLogins.vue'
import changePassword from '@/pages/Content/ChangePassword.vue'
import saveForgetPWD from '@/pages/Content/SaveForgetPWD.vue'
import forgetPWD from '@/components/SaveForgetPWD.vue'

// const home = () => import('@/pages/Home.vue')
// const chatMenu = () => import('@/pages/Submenu/ChatMenu.vue')
// const friendMenu = () => import('@/pages/Submenu/FriendMenu.vue')
// const myMenu = () => import('@/pages/Submenu/MyMenu.vue')

// const myInfo = () => import('@/pages/Content/MyInfo.vue')
// const myLogins = () => import('@/pages/Content/MyLogins.vue')
// const chatWindow = () => import('@/pages/Content/ChatWindow.vue')
// const register = () => import('@/pages/Register.vue')

Vue.use(VueRouter)

const router = new VueRouter({
  routes: [
    {
      name: 'enter',
      path: '/',
      component: enter,
      children: [
        {
          name: 'login',
          path: '',
          component: login
        },
        {
          name: 'login',
          path: '/login',
          component: login
        },
        {
          name: 'register',
          path: '/register',
          component: register
        },
        {
          name: 'forgetPWD',
          path: '/forgetPWD',
          component: forgetPWD
        }
      ]
    },
    {
      name: 'home',
      path: '/home',
      component: home,
      children: [
        {
          name: '_chat',
          path: '',
          redirect: { name: 'chat' }
        },
        {
          name: 'chat',
          path: 'c',
          components: {
            submenu: chatMenu
          }
        },
        {
          name: 'chat+win',
          path: 'c/:id',
          components: {
            submenu: chatMenu,
            content: chatWindow
          },
          props: {
            content: true
          }
        },
        {
          name: 'friend',
          path: 'f',
          components: {
            submenu: friendMenu
          }
        },
        {
          name: 'friend+win',
          path: 'f/:id',
          components: {
            submenu: friendMenu,
            content: chatWindow
          },
          props: {
            content: true
          }
        },
        {
          name: 'my',
          path: 'my'
        },
        {
          name: 'myLogins',
          path: 'myLogins',
          components: {
            submenu: myMenu,
            content: myLogins
          }
        },
        {
          name: 'myInfo',
          path: 'myInfo',
          components: {
            submenu: myMenu,
            content: myInfo
          }
        },
        {
          name: 'myBlacklist',
          path: 'myBlacklist',
          components: {
            submenu: myMenu,
            content: myBlacklist
          }
        },
        {
          name: 'myPassword',
          path: 'myPassword',
          components: {
            submenu: myMenu,
            content: changePassword
          }
        },
        {
          name: 'myForgetPWD',
          path: 'myForgetPWD',
          components: {
            submenu: myMenu,
            content: saveForgetPWD
          }
        }
      ]
    }
  ]
})

/**
 * 记录上一个 “聊天窗口”：更新store的当前会话(CurrentChatTarget)
 * @param {*} route 路由
 */
const updateCurrentChatTargetWhen = function (route)
{
  const { id } = route.params
  if (!id) return
  const { id: oldId } = store.getters.currentChatTarget
  if (oldId === id) return

  const target = store.getters.friends.find(t => t.id === id) || store.getters.groups.find(t => t.id === id)
  updateCurrentChatTarget(target)
}

/**
 * 如果 “聊天窗口”已经打开过，点击 好友/聊天菜单时就保持打开。
 * @param {path to} next
 */
const keepChatWindow = (next, name) =>
{
  const { id } = store.getters.currentChatTarget
  if (id)
  {
    next({ name, params: { id } })
  }
  else
  {
    next()
  }
}

router.afterEach((to, from) =>
{
  if ((from.name === null || from.matched[0].name === 'enter') && to.matched[0].name === 'home')
  {
    LinkCommunicationAndListening()
  } // 登陆后/刷新页面(from.name === null) 是链接rong

  if (to.name.indexOf('my') === 0 && to.name !== 'my')
  {
    updateLastMyWindow(to.name)
  } // 记录 上一个 “我的窗口”
  if (to.name.indexOf('chat') === 0 || to.name.indexOf('friend') === 0)
  {
    updateCurrentChatTargetWhen(to)
  } // 记录 上一个 “聊天窗口”

  if ((to.name === 'chat+win' || to.name === 'friend+win') && !store.getters.currentChatTarget.targetId)
  {
    router.push({ name: 'chat' })
    return
  }

  if (to.matched[0].name === 'enter')
  {
    console.log('logoutState')
    logoutState()
  } // 退出了，清理store
})

router.beforeEach((to, from, next) =>
{
  if (to.matched[0].name === 'home')
  {
    if (!store.getters.myInfo || !store.getters.myInfo.id)
    {
      next({ name: 'login' })
      return
    }
  }

  if (to.name === 'my')
  {
    next({ name: store.getters.lastMyWindow || 'myInfo' })
    return
  }

  if (to.name === 'friend' || to.name === 'chat')
  {
    keepChatWindow(next, `${to.name}+win`)
    return
  }

  const [toPath] = to.matched
  const [fromPath] = from.matched
  if (toPath && toPath.name === 'enter')
  {
    if (fromPath && fromPath.name === 'home')
    { // 退出，关闭rong链接，调用AppApi的logout
      logout().then(() =>
      {
        next()
      }).catch(error =>
      {
        next(false)
        console.log(`退出失败：${error}`)
      })
      return
    }
  }

  next()
})

export default router
