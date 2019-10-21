import ComponentLayout from '@/graph/graph/component/ComponentLayout';
import Graph from '@/graph/graph/Graph';
import {LinearComponentLayoutData, Size} from '@/graph/base/data';
import Positioned from '@/graph/base/Positioned';

interface LinearComponentLayoutConfig {
  direction: 'TD' | 'DT' | 'LR' | 'RL';
  spaceBetween: number;
}

export default class LinearComponentLayout extends ComponentLayout {
  private static defaultConfig = {
    direction: 'TD',
    spaceBetween: 12,
  };
  private contentSize?: Size;
  constructor(graph: Graph, parent: Positioned | null) {
    super(graph, parent);
  }
  public solve(config: LinearComponentLayoutData | undefined) {
    const newConfig: LinearComponentLayoutConfig = Object.assign({},
      LinearComponentLayout.defaultConfig, config);
    const components = this.graph.layouts!;
    const componentsSize = components.map((x) => x.getContentSize()!);
    if (newConfig.direction === 'LR' || newConfig.direction === 'RL') {
      this.contentSize = {
        width: componentsSize.map((x) => x.width).reduce((a, b) => a + b, 0) +
          Math.max(components.length - 1, 0) * newConfig.spaceBetween,
        height: Math.max(...componentsSize.map((x) => x.height), 0),
      };
      let begin = newConfig.direction === 'LR' ?
        -this.contentSize.width / 2 : this.contentSize.width / 2;
      for (let i = 0; i < components.length; ++i) {
        const deltaX = (newConfig.direction === 'LR' ?
          componentsSize[i].width / 2 : -componentsSize[i].width / 2) +
          begin;
        components[i].setPosition({ x: deltaX, y: 0 });
        if (newConfig.direction === 'LR') {
          begin += componentsSize[i].width + newConfig.spaceBetween;
        } else {
          begin -= componentsSize[i].width + newConfig.spaceBetween;
        }
      }
    } else {
      this.contentSize = {
        width: Math.max(...componentsSize.map((x) => x.width), 0),
        height: componentsSize.map((x) => x.height).reduce((a, b) => a + b, 0) +
          Math.max(components.length - 1, 0) * newConfig.spaceBetween,
      };
      let begin = newConfig.direction === 'DT' ?
        this.contentSize.height / 2 : -this.contentSize.height / 2;
      for (let i = 0; i < components.length; ++i) {
        const deltaY = (newConfig.direction === 'DT' ?
          -componentsSize[i].height / 2 : componentsSize[i].height / 2) +
          begin;
        components[i].setPosition({ x: 0, y: deltaY });
        if (newConfig.direction === 'DT') {
          begin -= componentsSize[i].height + newConfig.spaceBetween;
        } else {
          begin += componentsSize[i].height + newConfig.spaceBetween;
        }
      }
    } // position calculation
  }
  public render() {
    return {
      is: 'Group',
      key: `components`,
      config: {
        x: this.position.x,
        y: this.position.y,
      },
      children: this.graph.layouts!.map((x) => x.render()),
    };
  }
  public getContentSize() {
    return this.contentSize;
  }
}
