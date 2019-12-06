<template>
  <button class="doingButton button"
          :class="{doing:doing}"
          @click.stop="submit">
    {{value}}
    <i v-if="doing"
       title="忙碌中……"
       class="fa fa-spinner fa-spin"
       aria-hidden="true"></i>
  </button>
</template>

<script>
/**
 * button，是否忙碌中。
 */

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
