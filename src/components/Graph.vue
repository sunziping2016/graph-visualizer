<template>
  <div class="graph-container">
    <my-canvas ref="mainCanvas" :width="width" :height="height"
               :data="mainCanvasData" :enable-hit="true"
               @mousedown="mousedown" @wheel="wheel"
               v-on="mouseDragActive ? { mouseup, mousemove } : {}"
    ></my-canvas>
    <div class="thumbnail" :style="{
      width: thumbnailWidth + 'px',
      height: thumbnailHeight + 'px'
    }">
      <my-canvas ref="thumbnailCanvas"
                 :width="thumbnailWidth" :height="thumbnailHeight"
                 :data="thumbnailCanvasData" :enable-hit="true"
                 @mousedown="thumbnailMousedown"
                 v-on="thumbnailMouseDragActive ? {
                   mouseup: thumbnailMouseup,
                   mousemove: thumbnailMousemove,
                 } : {}"
      ></my-canvas>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator';
import {globalGraphRoot} from '@/graph/Root';
import MyCanvas from '@/components/MyCanvas.vue';
import Port from '@/graph/base/Port';

@Component({
  components: {
    MyCanvas,
  },
})
export default class Graph extends Vue {
  @Prop({ type: Number, required: true }) public readonly width!: number;
  @Prop({ type: Number, required: true }) public readonly height!: number;
  @Prop({ type: Array, default() { return []; }})
  public readonly data!: object[];
  private x = 0;
  private y = 0;
  private scale = 1;
  private size = { width: 0, height: 0 };
  private draggedId: null | string = null;
  private mouseDragActive = false;
  private mouseLastCoords = {
    x: 0,
    y: 0,
  };
  private maxThumbnailLength = 160;
  private minThumbnailLength = 100;
  private thumbnailPadding = 10;
  private thumbnailMouseDragActive = false;
  private thumbnailMouseLastCoords = {
    x: 0,
    y: 0,
  };
  get stageX() {
    return this.width / 2 + this.x;
  }
  get stageY() {
    return this.height / 2 + this.y;
  }
  public mounted() {
    this.updateSize();
  }
  @Watch('data')
  public onDataChanged() {
    this.updateSize();
  }
  public updateSize() {
    // noinspection SuspiciousTypeOfGuard
    if (globalGraphRoot.child instanceof Port) {
      this.size = globalGraphRoot.child.getBoundingBoxSize();
    }
  }
  get mainCanvasData() {
    return {
      is: 'group',
      x: this.stageX,
      y: this.stageY,
      scaleX: this.scale,
      scaleY: this.scale,
      children: this.data,
    };
  }
  get thumbnailCanvasData() {
    const scale = 1 / this.thumbnailFactor;
    function deepCopyAndRemoveDraggable(shape: any) {
      const copy = Object.assign({}, shape);
      if (copy.draggable) {
        delete copy.draggable;
      }
      if (copy.children) {
        copy.children = copy.children.map((x: any) =>
          deepCopyAndRemoveDraggable(x));
      }
      return copy;
    }
    const data = this.data.map((x: any) => deepCopyAndRemoveDraggable(x));
    const viewportX = (-this.width / 2 - this.x) / this.scale;
    const viewportY = (-this.height / 2 - this.y) / this.scale;
    const viewportWidth = this.width / this.scale;
    const viewportHeight = this.height / this.scale;
    data.push({
      is: 'rectWithWhole',
      id: 'mask',
      fill: 'rgba(0,0,0,0.2)',
      outerLeft: -this.thumbnailWidth * this.thumbnailFactor / 2,
      outerRight: this.thumbnailWidth * this.thumbnailFactor / 2,
      outerTop: -this.thumbnailHeight * this.thumbnailFactor / 2,
      outerBottom: this.thumbnailHeight * this.thumbnailFactor / 2,
      innerLeft: viewportX,
      innerRight: viewportX + viewportWidth,
      innerTop: viewportY,
      innerBottom: viewportY + viewportHeight,
    });
    data.push({
      is: 'rect',
      id: 'viewport',
      draggable: true,
      x: viewportX,
      y: viewportY,
      width: viewportWidth,
      height: viewportHeight,
      stroke: '#3eaf7c',
      strokeWidth: this.thumbnailFactor,
    });
    return {
      is: 'group',
      x: this.thumbnailWidth / 2,
      y: this.thumbnailHeight / 2,
      scaleX: scale,
      scaleY: scale,
      children: data,
    };
  }
  get thumbnailFactor() {
    return Math.max(this.size.width / this.maxThumbnailLength,
      this.size.height / this.maxThumbnailLength, 1);
  }
  get thumbnailWidth() {
    return Math.max(this.size.width / this.thumbnailFactor,
      this.minThumbnailLength) + 2 * this.thumbnailPadding;
  }
  get thumbnailHeight() {
    return Math.max(this.size.height / this.thumbnailFactor,
      this.minThumbnailLength) + 2 * this.thumbnailPadding;
  }
  public wheel(e: WheelEvent) {
    const scaleBy = 1.1;
    e.preventDefault();
    const pos = this.translateMouseEvent(e);
    const mousePointTo = {
      x: (pos.x - this.stageX) / this.scale,
      y: (pos.y - this.stageY) / this.scale,
    };
    this.scale = e.deltaY < 0 ? this.scale * scaleBy : this.scale / scaleBy;
    const newPos = {
      x: -(mousePointTo.x - pos.x / this.scale) *
        this.scale,
      y: -(mousePointTo.y - pos.y / this.scale) *
        this.scale,
    };
    this.x = newPos.x - this.width / 2;
    this.y = newPos.y - this.height / 2;
  }
  public translateMouseEvent(e: MouseEvent): {x: number, y: number} {
    let elementOffsetX = 0;
    let elementOffsetY = 0;
    let target = e.currentTarget;
    while (target) {
      elementOffsetX += (target as HTMLElement).offsetLeft;
      elementOffsetY += (target as HTMLElement).offsetTop;
      target = (target as HTMLElement).offsetParent;
    }
    return {
      x: e.pageX - elementOffsetX,
      y: e.pageY - elementOffsetY,
    };
  }
  public mousedown(e: MouseEvent) {
    this.mouseDragActive = true;
    this.mouseLastCoords = {
      x: e.pageX,
      y: e.pageY,
    };
    const pos = this.translateMouseEvent(e);
    const id = (this.$refs.mainCanvas as any).getIdFromHitPoint(pos.x, pos.y);
    if (id) {
      this.draggedId = id;
      globalGraphRoot.setFixed([id]);
    }
  }
  public mouseup() {
    this.mouseDragActive = false;
    this.draggedId = null;
    globalGraphRoot.clearFixed();
  }
  public mousemove(e: MouseEvent) {
    if (e.buttons === 0) {
      this.mouseDragActive = false;
    }
    if (this.mouseDragActive || this.draggedId) {
      const newCoords = {
        x: e.pageX,
        y: e.pageY,
      };
      const deltaX = newCoords.x - this.mouseLastCoords.x;
      const deltaY = newCoords.y - this.mouseLastCoords.y;
      if (this.draggedId) {
        globalGraphRoot.movePort(this.draggedId, {
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
  public thumbnailMousedown(e: MouseEvent) {
    const pos = this.translateMouseEvent(e);
    const id = (this.$refs.thumbnailCanvas as any)
      .getIdFromHitPoint(pos.x, pos.y);
    if (id === 'viewport') {
      this.thumbnailMouseDragActive = true;
      this.thumbnailMouseLastCoords = {
        x: e.pageX,
        y: e.pageY,
      };
    }
  }
  public thumbnailMouseup() {
    this.thumbnailMouseDragActive = false;
  }
  public thumbnailMousemove(e: MouseEvent) {
    if (e.buttons === 0) {
      this.thumbnailMouseDragActive = false;
    }
    if (this.thumbnailMouseDragActive) {
      const newCoords = {
        x: e.pageX,
        y: e.pageY,
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
