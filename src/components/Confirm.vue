<template>
  <el-dialog :title="title" :visible.sync="visible" :width="width" :before-close="onClose">
    <span v-if="content" v-html="content"></span>
    <span slot="footer">
      <button class="button" @click="submit">确 定</button>
      <button class="button cancelButton" @click="onClose">取 消</button>
    </span>
  </el-dialog>
</template>

<script>
/**
 * confirm对话框
 */
export default {
  template: '<div>{{visible}}</div>',
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
      default: () => {}
    }
  },
  data() {
    return {}
  },
  methods: {
    onClose() {
      this.$emit('update:visible', false)
    },
    submit() {
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
