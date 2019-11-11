<template>
  <div :style="{ width, height }" style="position: relative">
    <canvas ref="hitCanvas"
            v-if="enableHit"
            :style="{ display: 'none'}"
    ></canvas>
    <canvas ref="canvas"
            v-on="$listeners"
    ></canvas>
    <slot></slot>
  </div>
</template>

<script lang="ts">
import {Vue, Component, Provide, Prop, Watch} from 'vue-property-decorator';
import CanvasProvider from '@/components/renderable/CanvasProvider';

@Component
export default class MyCanvas extends Vue {
  @Prop({ type: Number, required: true }) public readonly width!: number;
  @Prop({ type: Number, required: true }) public readonly height!: number;
  @Prop(Boolean) public readonly enableHit: boolean | undefined;
  @Provide() public provider: CanvasProvider = {
    context: null,
    hitContext: null,
    hitColorMap: {},
  };
  public mounted() {
    this.provider.context = (this.$refs.canvas as HTMLCanvasElement)
      .getContext('2d');
    (this.$refs.canvas as HTMLCanvasElement).width = this.width;
    (this.$refs.canvas as HTMLCanvasElement).height = this.height;
    if (this.enableHit) {
      this.provider.hitContext = (this.$refs.hitCanvas as HTMLCanvasElement)
        .getContext('2d');
      (this.$refs.hitCanvas as HTMLCanvasElement).width = this.width;
      (this.$refs.hitCanvas as HTMLCanvasElement).height = this.height;
    }
  }
  public beforeUpdate() {
    if (this.provider.context) {
      this.provider.context.clearRect(0, 0, this.width, this.height);
    }
    if (this.provider.hitContext) {
      this.provider.hitContext.clearRect(0, 0, this.width, this.height);
      this.provider.hitColorMap = {};
    }
  }
  @Provide()
  public generateHitColor(id: string): string {
    while (true) {
      const r = Math.round(Math.random() * 255);
      const g = Math.round(Math.random() * 255);
      const b = Math.round(Math.random() * 255);
      const color = `rgb(${r},${g},${b})`;
      if (!this.provider.hitColorMap[color]) {
        this.provider.hitColorMap[color] = id;
        return color;
      }
    }
  }
  public getIdFromHitPoint(x: number, y: number): string | undefined {
    if (this.provider.hitContext) {
      const pixel = this.provider.hitContext.getImageData(x, y, 1, 1).data;
      const color = `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`;
      return this.provider.hitColorMap[color];
    }
  }
  @Watch('width')
  public onWidthChanged() {
    (this.$refs.canvas as HTMLCanvasElement).width = this.width;
    if (this.enableHit) {
      (this.$refs.hitCanvas as HTMLCanvasElement).width = this.width;
    }
  }
  @Watch('height')
  public onHeightChanged() {
    (this.$refs.canvas as HTMLCanvasElement).height = this.height;
    if (this.enableHit) {
      (this.$refs.hitCanvas as HTMLCanvasElement).height = this.height;
    }
  }
}

</script>
