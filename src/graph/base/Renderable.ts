import {RenderableData} from '@/graph/base/dataInput';
import {AnyShape} from '@/graph/base/dataOutput';

export interface ParentData {
  parentId: string;
  depth: number;
}

export default interface Renderable {
  updateData(data: RenderableData, parentData: ParentData | null): void;
  render(): AnyShape;
}
