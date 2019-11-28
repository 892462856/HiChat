<template>
  <div class="fixedLayer"
       :class="{active:visible}">
    <div class="fixedLayer-content"
         @click="onClickBg">
      <slot></slot>
    </div>
    <div class="bg"></div>
  </div>
</template>

<script>
/**
 * 简单 弹出层
 *  <fixedLayer class="chatWindowScreen-picDisplayer" :visible.sync="picDisplayer.visible">
      <img :src="picDisplayer.url" />
    </fixedLayer>
 */

export default {
  props: {
    visible: {
      type: Boolean,
      required: true
    },
    closeOnClickModal: {
      type: Boolean,
      required: false,
      default: true
    }
  },
  name: 'fixedLayer',
  mounted () 
  {
    const body = document.querySelector('body')
    if (body.append)    
    {
      body.append(this.$el)
    }
    else    
    {
      body.appendChild(this.$el)
    }
  },
  methods: {
    onClickBg (event)    
    {
      if (event.currentTarget !== event.target) return
      if (this.closeOnClickModal)      
      {
        this.close()
      }
    },
    close ()    
    {
      this.$emit('update:visible', false)
    }
  }
}
</script>

<style scoped lang="scss">
.fixedLayer {
  display: none;
  position: fixed;
  z-index: 11111;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  .bg {
    position: absolute;
    z-index: -1;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #000;
    opacity: 0.5;
  }
  .fixedLayer-content {
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    overflow: auto;

    display: flex;
    align-items: center;
    justify-content: center;
  }
}
.fixedLayer.active {
  display: block;
}
</style>
