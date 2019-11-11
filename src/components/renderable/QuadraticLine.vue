<template>
  <v-shape :config="shapeConfig"></v-shape>
</template>

<script lang="ts">
import {Component, Prop, Vue} from 'vue-property-decorator';

@Component
export default class QuadraticLine extends Vue {
  @Prop(Object) public readonly config: object | undefined;
  get params() {
    return Object.assign({}, {
      points: [0, 0, 0, 0, 0, 0],
      stroke: 'black',
      strokeWidth: 1,
    }, this.config);
  }
  get shapeConfig() {
    return {
      sceneFunc: (context: CanvasRenderingContext2D, shape: any) => {
        const points = this.params.points;
        context.beginPath();
        context.moveTo(points[0], points[1]);
        context.quadraticCurveTo(points[2], points[3], points[4], points[5]);
        (context as any).setAttr('strokeStyle', this.params.stroke);
        (context as any).setAttr('lineWidth', this.params.strokeWidth);
        context.stroke();
      },
    };
  }
}
</script>
