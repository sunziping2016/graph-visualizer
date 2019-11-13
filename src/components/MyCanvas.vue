<template>
  <div :style="{ width, height, position: 'relative' }">
    <canvas ref="hitCanvas"
            v-if="enableHit"
            style="position: absolute; display: none"
    ></canvas>
    <canvas ref="canvas"
            style="position: absolute"
            v-on="$listeners"
    ></canvas>
  </div>
</template>

<script lang="ts">
import {Vue, Component, Provide, Prop, Watch} from 'vue-property-decorator';
import {AnyShape} from '@/graph/base/dataOutput';

@Component
export default class MyCanvas extends Vue {
  @Prop({ type: Number, required: true }) public readonly width!: number;
  @Prop({ type: Number, required: true }) public readonly height!: number;
  @Prop(Boolean) public readonly enableHit: boolean | undefined;
  @Prop(Object) public readonly data: AnyShape | undefined;
  private context: CanvasRenderingContext2D | null = null;
  private hitContext: CanvasRenderingContext2D | null = null;
  private hitColorMap: { [color: string]: string } = {};
  private hitIdMap: { [id: string]: string } = {};
  public mounted() {
    this.context = (this.$refs.canvas as HTMLCanvasElement)
      .getContext('2d');
    (this.$refs.canvas as HTMLCanvasElement).width = this.width;
    (this.$refs.canvas as HTMLCanvasElement).height = this.height;
    if (this.enableHit) {
      this.hitContext = (this.$refs.hitCanvas as HTMLCanvasElement)
        .getContext('2d');
      (this.$refs.hitCanvas as HTMLCanvasElement).width = this.width;
      (this.$refs.hitCanvas as HTMLCanvasElement).height = this.height;
    }
  }
  @Provide()
  public generateHitColor(id: string): string {
    if (this.hitIdMap[id]) {
      return this.hitIdMap[id];
    }
    while (true) {
      const r = Math.round(Math.random() * 255);
      const g = Math.round(Math.random() * 255);
      const b = Math.round(Math.random() * 255);
      const color = `rgb(${r},${g},${b})`;
      if (!this.hitColorMap[color]) {
        this.hitColorMap[color] = id;
        this.hitIdMap[id] = color;
        return color;
      }
    }
  }
  public updateCanvas() {
    if (!this.context) {
      return;
    }
    const ctx: CanvasRenderingContext2D = this.context;
    const hitCtx = this.hitContext;
    ctx.clearRect(0, 0, this.width, this.height);
    if (hitCtx) {
      hitCtx.clearRect(0, 0, this.width, this.height);
      this.hitColorMap = {};
      this.hitIdMap = {};
    }
    const updateShape = (shape: AnyShape,
                         draggable: boolean,
                         draggableId: string) => {
      const finalDraggable = shape.draggable || draggable;
      const finalId = shape.id || draggableId;
      switch (shape.is) {
        case 'group': {
          ctx.save();
          ctx.translate(shape.x || 0, shape.y || 0);
          ctx.scale(shape.scaleX || 1, shape.scaleY || 1);
          if (hitCtx) {
            hitCtx.save();
            hitCtx.translate(shape.x || 0, shape.y || 0);
            hitCtx.scale(shape.scaleX || 1, shape.scaleY || 1);
          }
          if (shape.children) {
            for (const childShape of shape.children) {
              updateShape(childShape, shape.draggable || draggable,
                shape.id || draggableId);
            }
          }
          ctx.restore();
          if (hitCtx) {
            hitCtx.restore();
          }
          break;
        }
        case 'rect': {
          ctx.beginPath();
          ctx.rect(shape.x || 0, shape.y || 0,
            shape.width || 0, shape.height || 0);
          if (shape.fill) {
            ctx.fillStyle = shape.fill;
            ctx.fill();
          }
          if (shape.stroke) {
            ctx.lineWidth = shape.strokeWidth || 1;
            ctx.strokeStyle = shape.stroke;
            ctx.stroke();
          }
          if (hitCtx && finalDraggable && finalId) {
            const color = this.generateHitColor(finalId);
            hitCtx.beginPath();
            hitCtx.rect(shape.x || 0, shape.y || 0,
              shape.width || 0, shape.height || 0);
            hitCtx.fillStyle = color;
            hitCtx.fill();
            if (shape.stroke) {
              hitCtx.lineWidth = shape.strokeWidth || 1;
              hitCtx.strokeStyle = color;
              hitCtx.stroke();
            }
          }
          break;
        }
        case 'text': {
          const fontSize = shape.fontSize || 12;
          const lineHeight = shape.lineHeight || 1.2;
          const padding = shape.padding || 4;
          ctx.font = `${fontSize}px ${shape.fontFamily || 'sans-serif'}`;
          const lines = shape.text ? shape.text.split('\n') : [];
          const linesWidth = lines.map((x: string) => ctx.measureText(x).width);
          const width = Math.max(...linesWidth, 0);
          let posY = (shape.y || 0) + padding;
          ctx.textBaseline = 'top';
          ctx.fillStyle = shape.fill || 'black';
          for (let i = 0; i < lines.length; ++i) {
            let posX = (shape.x || 0) + padding;
            if (shape.align === 'left') {
              // do nothing
            } else if (shape.align === 'right') {
              posX += width - linesWidth[i];
            } else {
              posX += (width - linesWidth[i]) / 2;
            }
            ctx.fillText(lines[i], posX,
              posY + 0.5 * (lineHeight - 1) * fontSize);
            posY += lineHeight * fontSize;
          }
          break;
        }
        case 'line': {
          const points = shape.points || [];
          ctx.strokeStyle = shape.stroke || 'black';
          ctx.lineWidth = shape.strokeWidth || 1;
          ctx.beginPath();
          ctx.moveTo(points[0] || 0, points[1] || 0);
          ctx.lineTo(points[2] || 0, points[3] || 0);
          ctx.stroke();
          break;
        }
        case 'quadraticLine': {
          const points = shape.points || [];
          ctx.strokeStyle = shape.stroke || 'black';
          ctx.lineWidth = shape.strokeWidth || 1;
          ctx.beginPath();
          ctx.moveTo(points[0] || 0, points[1] || 0);
          ctx.quadraticCurveTo(points[2] || 0, points[3] || 0,
            points[4] || 0, points[5] || 0);
          ctx.stroke();
          break;
        }
        case 'pointer': {
          const x = shape.x || 0;
          const y = shape.y || 0;
          const angle = shape.angle || 0;
          const width = shape.width || 10;
          const height = shape.height || 15;
          const middleX = x + height * Math.cos(angle);
          const middleY = y + height * Math.sin(angle);
          const deltaX = width / 2 * Math.sin(angle);
          const deltaY = -width / 2 * Math.cos(angle);
          ctx.fillStyle = shape.fill || 'black';
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(middleX + deltaX, middleY + deltaY);
          ctx.lineTo(middleX - deltaX, middleY - deltaY);
          ctx.closePath();
          ctx.fill();
          break;
        }
        case 'rectWithWhole': {
          ctx.beginPath();
          ctx.moveTo(shape.outerLeft || 0, shape.outerTop || 0);
          ctx.lineTo(shape.outerRight || 0, shape.outerTop || 0);
          ctx.lineTo(shape.outerRight || 0, shape.outerBottom || 0);
          ctx.lineTo(shape.outerLeft || 0, shape.outerBottom || 0);
          ctx.lineTo(shape.outerLeft || 0, shape.outerTop || 0);
          ctx.moveTo(shape.innerLeft || 0, shape.innerTop || 0);
          ctx.lineTo(shape.innerLeft || 0, shape.innerBottom || 0);
          ctx.lineTo(shape.innerRight || 0, shape.innerBottom || 0);
          ctx.lineTo(shape.innerRight || 0, shape.innerTop || 0);
          ctx.lineTo(shape.innerLeft || 0, shape.innerTop || 0);
          ctx.fillStyle = shape.fill || 'white';
          ctx.fill();
          break;
        }
        default:
          throw new Error(`Unknown shape`);
      }
    };
    if (this.data) {
      updateShape(this.data, false, '');
    }
  }
  public getIdFromHitPoint(x: number, y: number): string | undefined {
    if (this.hitContext) {
      const pixel = this.hitContext.getImageData(x, y, 1, 1).data;
      const color = `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`;
      return this.hitColorMap[color];
    }
  }
  @Watch('width')
  public onWidthChanged() {
    (this.$refs.canvas as HTMLCanvasElement).width = this.width;
    if (this.enableHit) {
      (this.$refs.hitCanvas as HTMLCanvasElement).width = this.width;
    }
    this.updateCanvas();
  }
  @Watch('height')
  public onHeightChanged() {
    (this.$refs.canvas as HTMLCanvasElement).height = this.height;
    if (this.enableHit) {
      (this.$refs.hitCanvas as HTMLCanvasElement).height = this.height;
    }
    this.updateCanvas();
  }
  @Watch('data')
  public onDataChanged() {
    this.updateCanvas();
  }
}

</script>
