import {RenderableData} from '@/graph/base/dataInput';
import {AnyShape} from '@/graph/base/dataOutput';

export default interface Renderable {
  updateData(data: RenderableData): void;
  render(): AnyShape;
}
