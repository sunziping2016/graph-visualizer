<script lang="ts">
import {Vue, Component, Prop, Inject} from 'vue-property-decorator';
import CanvasProvider from '@/components/renderable/CanvasProvider';

@Component
export default class MyRect extends Vue {
  @Prop(Number) public readonly x: number | undefined;
  @Prop(Number) public readonly y: number | undefined;
  @Prop(Number) public readonly width: number | undefined;
  @Prop(Number) public readonly height: number | undefined;
  @Prop(String) public readonly fill: string | undefined;
  @Prop(String) public readonly stroke: string | undefined;
  @Prop(Number) public readonly strokeWidth: number | undefined;
  @Prop(String) public readonly id: string | undefined;
  @Prop(Boolean) public readonly draggable: boolean | undefined;
  @Inject() public readonly provider!: CanvasProvider;
  @Inject() public readonly generateHitColor!: (id: string) => string;
  public render() {
    let ctx: CanvasRenderingContext2D | null = this.provider.context;
    if (!ctx) {
      return;
    }
    ctx.beginPath();
    ctx.rect(this.x || 0, this.y || 0, this.width || 0, this.height || 0);
    if (this.fill) {
      ctx.fillStyle = this.fill;
      ctx.fill();
    }
    if (this.stroke) {
      ctx.lineWidth = this.strokeWidth || 1;
      ctx.strokeStyle = this.stroke;
      ctx.stroke();
    }
    ctx = this.provider.hitContext;
    if (!ctx || !this.id || !this.draggable) {
      return;
    }
    const color = this.generateHitColor(this.id);
    ctx.beginPath();
    ctx.rect(this.x || 0, this.y || 0, this.width || 0, this.height || 0);
    if (this.fill) {
      ctx.fillStyle = color;
      ctx.fill();
    }
    if (this.stroke) {
      ctx.lineWidth = this.strokeWidth || 1;
      ctx.strokeStyle = color;
      ctx.stroke();
    }
  }
}
</script>
