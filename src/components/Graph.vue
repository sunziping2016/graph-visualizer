<template>
  <div class="graph-container">
    <v-stage ref="stage"
             :config="{ width, height, x: width / 2 + x, y: height / 2 + y }"
             @mousedown="mousedown"
             v-on="mouseDragActive || draggedId ? { mouseup, mousemove } : {}"
             @wheel="wheel"
    >
      <v-layer v-for="layer of data" :key="layer.key">
        <component v-for="component of layer.children"
                   :is="component.is"
                   :key="component.key"
                   v-bind="component"
        ></component>
      </v-layer>
    </v-stage>
    <div class="thumbnail" :style="{
      width: thumbnailWidth + 'px',
      height: thumbnailHeight + 'px',
    }">
      <v-stage ref="thumbnailStage"
               :config="{ width: thumbnailWidth, height: thumbnailHeight,
               x: thumbnailWidth / 2, y: thumbnailHeight / 2 }"
               v-on="thumbnailMouseDragActive ? {
                 mouseup: thumbnailMouseup,
                 mousemove: thumbnailMousemove
               } : {}"
      >
        <v-layer v-for="layer of data" :key="layer.key">
          <component v-for="component of layer.children"
                     :is="component.is"
                     :key="component.key"
                     v-bind="component"
          ></component>
          <v-shape :config="thumbnailViewportBackgroundConfig"></v-shape>
          <v-rect :config="thumbnailViewportConfig"
                  @mousedown="thumbnailMousedown"
          ></v-rect>
        </v-layer>
      </v-stage>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator';
import Group from './renderable/Group.vue';
import {globalRoot} from '@/graph/Root';
import Pointer from '@/components/renderable/Pointer.vue';

Vue.component('Group', Group);
Vue.component('Pointer', Pointer);

@Component
export default class Graph extends Vue {
  @Prop({ type: Number, required: true }) public readonly width!: number;
  @Prop({ type: Number, required: true }) public readonly height!: number;
  @Prop({ type: Array, default() { return []; }})
  public readonly data!: object[];
  private x = 0;
  private y = 0;
  private scale = 1;
  private draggedId: null | string = null;
  private mouseDragActive = false;
  private mouseLastCoords = {
    x: 0,
    y: 0,
  };
  private thumbnailMouseDragActive = false;
  private thumbnailMouseLastCoords = {
    x: 0,
    y: 0,
  };
  public mounted() {
    this.updateThumbnailScale();
  }
  @Watch('scale')
  public onScaleChanged() {
    const stage = (this.$refs.stage as any).getStage();
    stage.scale({ x: this.scale, y: this.scale });
    stage.draw();
  }
  @Watch('thumbnailFactor')
  public onThumbnailFactorChanged() {
    this.updateThumbnailScale();
  }
  get thumbnailFactor() {
    return Math.min(this.width, this.height) > 600 ? 5 : 4;
  }
  get thumbnailWidth() {
    return this.width / this.thumbnailFactor;
  }
  get thumbnailHeight() {
    return this.height / this.thumbnailFactor;
  }
  get thumbnailViewportConfig() {
    return {
      x: (-this.width / 2 - this.x) / this.scale,
      y: (-this.height / 2 - this.y) / this.scale,
      width: this.width / this.scale,
      height: this.height / this.scale,
      stroke: '#3eaf7c',
      strokeWidth: this.thumbnailFactor,
    };
  }
  get thumbnailViewportBackgroundConfig() {
    const viewport = this.thumbnailViewportConfig;
    return {
      fill: 'rgba(0,0,0,0.2)',
      sceneFunc: (ctx: any, shape: any) => {
        ctx.beginPath();
        ctx.moveTo(-this.width / 2, -this.height / 2);
        ctx.lineTo(this.width / 2, -this.height / 2);
        ctx.lineTo(this.width / 2, this.height / 2);
        ctx.lineTo(-this.width / 2, this.height / 2);
        ctx.lineTo(-this.width / 2, -this.height / 2);
        ctx.moveTo(viewport.x, viewport.y);
        ctx.lineTo(viewport.x, viewport.y + viewport.height);
        ctx.lineTo(viewport.x + viewport.width, viewport.y + viewport.height);
        ctx.lineTo(viewport.x + viewport.width, viewport.y);
        ctx.lineTo(viewport.x, viewport.y);
        ctx.fillStrokeShape(shape);
      },
    };
  }
  public updateThumbnailScale() {
    const scale = 1 / this.thumbnailFactor;
    (this.$refs.thumbnailStage as any).getStage().scale({ x: scale, y: scale });
  }
  public wheel(e: { evt: WheelEvent }) {
    const scaleBy = 1.1;
    e.evt.preventDefault();
    const stage = (this.$refs.stage as any).getStage();
    const mousePointTo = {
      x: (stage.getPointerPosition().x - stage.x()) / this.scale,
      y: (stage.getPointerPosition().y - stage.y()) / this.scale,
    };
    this.scale = e.evt.deltaY < 0 ? this.scale * scaleBy :
      this.scale / scaleBy;
    const newPos = {
      x: -(mousePointTo.x - stage.getPointerPosition().x / this.scale) *
        this.scale,
      y: -(mousePointTo.y - stage.getPointerPosition().y / this.scale) *
        this.scale,
    };
    this.x = newPos.x - this.width / 2;
    this.y = newPos.y - this.height / 2;
  }
  public setDraggedIdAndPos(id: string, pos: {x: number, y: number}) {
    this.draggedId = id;
    this.mouseLastCoords = pos;
  }
  public mousedown(e: { evt: MouseEvent }) {
    this.mouseDragActive = true;
    this.mouseLastCoords = {
      x: e.evt.pageX,
      y: e.evt.pageY,
    };
  }
  public mouseup() {
    this.mouseDragActive = false;
    this.draggedId = null;
  }
  public mousemove(e: { evt: MouseEvent }) {
    if (e.evt.buttons === 0) {
      this.mouseDragActive = false;
    }
    if (this.mouseDragActive || this.draggedId) {
      const newCoords = {
        x: e.evt.pageX,
        y: e.evt.pageY,
      };
      const deltaX = newCoords.x - this.mouseLastCoords.x;
      const deltaY = newCoords.y - this.mouseLastCoords.y;
      if (this.draggedId) {
          globalRoot.moveDraggable(this.draggedId, {
              deltaX: deltaX / this.scale,
              deltaY: deltaY / this.scale,
          });
      } else {
        this.x += deltaX;
        this.y += deltaY;
      }
      this.mouseLastCoords = newCoords;
    }
  }
  public thumbnailMousedown(e: { evt: MouseEvent }) {
    this.thumbnailMouseDragActive = true;
    this.thumbnailMouseLastCoords = {
      x: e.evt.pageX,
      y: e.evt.pageY,
    };
  }
  public thumbnailMouseup() {
    this.thumbnailMouseDragActive = false;
  }
  public thumbnailMousemove(e: { evt: MouseEvent }) {
    if (e.evt.buttons === 0) {
      this.thumbnailMouseDragActive = false;
    }
    if (this.thumbnailMouseDragActive) {
      const newCoords = {
        x: e.evt.pageX,
        y: e.evt.pageY,
      };
      const oldCoords = this.thumbnailMouseLastCoords;
      const scale = this.thumbnailFactor * this.scale;
      this.x -= (newCoords.x - oldCoords.x) * scale;
      this.y -= (newCoords.y - oldCoords.y) * scale;
      this.thumbnailMouseLastCoords = newCoords;
    }
  }
}
</script>

<style lang="stylus" scoped>
@import '../styles/config.styl'

.graph-container
  position relative
  top 0
  right 0
  bottom 0
  left 0
  .thumbnail
    border 1px solid lighten($themeColor, 50%)
    position absolute
    top .3rem
    right .3rem
    background-color rgba(255, 255, 255, .9)
</style>
