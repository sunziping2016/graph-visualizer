import {RenderableData} from '@/graph/base/data';

export default interface Renderable {
  setData(data: RenderableData): void;
  render(): object;
}
