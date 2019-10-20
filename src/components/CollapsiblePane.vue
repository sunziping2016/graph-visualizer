<template>
  <div>
    <h2 class="pane-title" @click="click">
      {{ title }}
      <v-icon class="pane-arrow" :class="{ 'pane-arrow-expand': expand }"
              name="angle-up"></v-icon>
    </h2>
    <div class="pane-content" ref="paneContent"
         :style="animationHeight !== null ?
                 { height: animationHeight + 'px' } : {}"
    >
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts">
import 'vue-awesome/icons/angle-up';
import { Vue, Component, Prop } from 'vue-property-decorator';

@Component
export default class CollapsiblePane extends Vue {
  @Prop(String) public readonly title: string | undefined;
  private expand = true;
  private realHeight = 0;
  private animationHeight: number|null = null;
  public mounted() {
    const content = this.$refs.paneContent as HTMLElement;
    this.realHeight = content.offsetHeight;
    content.addEventListener('transitionend', this.transitionEnd.bind(this));
  }
  public click() {
    this.expand = !this.expand;
    if (this.expand) {
      this.animationHeight = 0;
      setTimeout(() => {
        this.animationHeight = this.realHeight;
      });
    } else {
      const content = this.$refs.paneContent as HTMLElement;
      this.realHeight = content.offsetHeight;
      this.animationHeight = this.realHeight;
      setTimeout(() => {
        this.animationHeight = 0;
      });
    }
  }
  public transitionEnd() {
    if (this.animationHeight !== 0) {
      this.animationHeight = null;
    }
  }
}
</script>

<style lang="stylus" scoped>
.pane-title
  margin 0
  font-size 1.2rem
  cursor pointer

.pane-arrow
  float right
  transition transform .3s linear
  transform rotate(0deg)
  &-expand
    transform rotate(180deg)

.pane-content
  overflow hidden
  transition height .3s ease
</style>
