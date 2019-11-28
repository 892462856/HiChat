import Vue from 'vue'
import ConfirmVue from './Confirm.vue'

export default function ({ title, content, width, onOk })
{
  const MyComponent = Vue.extend(ConfirmVue)
  const t = new MyComponent({
    propsData: {
      visible: true, title, content, width, onOk
    }
  })
  t.$on('update:visible', (val) =>
  {
    t.visible = val
    setTimeout(() =>
    {
      if (t.$el.parentNode)
      {
        t.$el.parentNode.removeChild(t.$el)
      }
    }, 1000)
  })

  t.$mount()
  document.body.appendChild(t.$el)
}
