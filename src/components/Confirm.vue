<template>
  <fixedLayer :visible.sync="visible"
              @close="onClose">
    <div class="confirm"
         :style="{width:width}">
      <div class="confirm-head"
           v-if="title">{{title}}</div>

      <div class="confirm-content"
           v-if="content"
           v-html="content">
      </div>
      <slot v-else></slot>

      <span class="confirm-footer">
        <button class="button"
                @click="submit">确 定</button>
        <button class="button cancelButton"
                @click="onClose">取 消</button>
      </span>
    </div>
  </fixedLayer>
</template>

<script>
/**
 * confirm对话框
 */
import fixedLayer from './FixedLayer.vue'

export default {
  components: { fixedLayer },
  props: {
    visible: {
      type: Boolean,
      required: true
    },
    width: {
      type: String,
      required: false,
      default: '400px'
    },
    title: {
      type: String,
      required: false,
      default: ''
    },
    content: {
      type: String,
      required: false,
      default: ''
    },
    onOk: {
      type: Function,
      required: false,
      default: () =>
      { }
    }
  },
  methods: {
    onClose ()    
    {
      this.$emit('update:visible', false)
    },
    submit ()    
    {
      this.$emit('update:visible', false)
      this.onOk()
    }
  }
}
</script>

<style scoped lang="scss">
.cancelButton {
  margin-left: 2rem;
}
</style>
