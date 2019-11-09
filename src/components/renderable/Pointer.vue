<template>
  <v-line :config="pointerConfig"></v-line>
</template>

<script lang="ts">
import {Component, Prop, Vue} from 'vue-property-decorator';

@Component
export default class Pointer extends Vue {
  @Prop(Number) public readonly x: number | undefined;
  @Prop(Number) public readonly y: number | undefined;
  @Prop(Number) public readonly angle: number | undefined;
  @Prop(Number) public readonly width: number | undefined;
  @Prop(Number) public readonly height: number | undefined;
  @Prop(String) public readonly fill: string | undefined;
  get pointerConfig() {
    const x = this.x || 0;
    const y = this.y || 0;
    const angle = this.angle || 0;
    const width = this.width || 10;
    const height = this.height || 15;
    const fill = this.fill || 'black';
    const middleX = x + height * Math.cos(angle);
    const middleY = y + height * Math.sin(angle);
    const deltaX = width / 2 * Math.sin(angle);
    const deltaY = -width / 2 * Math.cos(angle);
    return {
      points: [
          x, y,
          middleX + deltaX, middleY + deltaY,
          middleX - deltaX, middleY - deltaY,
      ],
      closed: true,
      fill,
    };
  }
}
</script>
