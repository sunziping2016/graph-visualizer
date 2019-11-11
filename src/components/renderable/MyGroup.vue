<script lang="ts">
import {Vue, Component, Prop, Inject} from 'vue-property-decorator';
import CanvasProvider from '@/components/renderable/CanvasProvider';

@Component
export default class MyGroup extends Vue {
  @Prop(Number) public readonly x: number | undefined;
  @Prop(Number) public readonly y: number | undefined;
  @Prop(Number) public readonly scaleX: number | undefined;
  @Prop(Number) public readonly scaleY: number | undefined;
  @Prop(String) public readonly id: string | undefined;
  @Inject() public readonly provider!: CanvasProvider;
  public render(createElement: Vue.CreateElement) {
    return createElement('div', this.$slots.default);
  }
  public beforeUpdate() {
    let ctx: CanvasRenderingContext2D | null = this.provider.context;
    if (!ctx) {
      return;
    }
    ctx.save();
    ctx.translate(this.x || 0, this.y || 0);
    ctx.scale(this.scaleX || 1, this.scaleY || 1);
    ctx = this.provider.hitContext;
    if (!ctx) {
      return;
    }
    ctx.save();
    ctx.translate(this.x || 0, this.y || 0);
    ctx.scale(this.scaleX || 1, this.scaleY || 1);
  }
  public updated() {
    let ctx: CanvasRenderingContext2D | null = this.provider.context;
    if (!ctx) {
      return;
    }
    ctx.restore();
    ctx = this.provider.hitContext;
    if (!ctx) {
      return;
    }
    ctx.restore();
  }
}
</script>
