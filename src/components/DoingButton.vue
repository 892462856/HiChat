<template>
  <button class="doingButton button"
          :class="{doing:doing}"
          @click.stop="submit">
    {{value}}
    <i v-show="doing"
       title="忙碌中……"
       class="fa fa-spinner"
       aria-hidden="true"></i>
  </button>
</template>

<script>
/**
 * button，是否忙碌中。
 */

const spining = function (el)
{
  let i = 0
  const n = setInterval(() =>  
  {
    i += 2
    el.style.transform = `rotate(${i}deg)`
    i = i > 360 ? i - 360 : i
  }, 10)
  return n
}

export default {
  props: {
    value: {
      type: String,
      required: false,
      default: '确 定'
    },
    doing: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  name: 'doingButton',
  mounted ()  
  {
    if (this.doing)    
    {
      this._n = spining(this.$el.querySelector('.fa-spinner'))
    }
  },
  watch: {
    doing: {
      handler (val)      
      {
        if (val)        
        {
          this._n = spining(this.$el.querySelector('.fa-spinner'))
        }
        else if (this._n)        
        {
          clearInterval(this._n)
        }
      },
      immediate: false
    }
  },
  methods: {
    submit ()    
    {
      if (this.doing) return

      this.$emit('submit')
    }
  }
}
</script>

<style scoped lang="scss">
.doingButton {
  position: relative;
  .fa-spinner {
    position: absolute;
    top: 50%;
    left: 50%;
    margin-top: -0.8rem;
    margin-left: -1rem;

    font-size: 2rem;
    color: #00f;
  }
}
.doingButton.doing {
  cursor: default;
  opacity: 0.5 !important;
}
</style>
