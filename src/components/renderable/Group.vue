<template>
  <v-group :config="config"
           v-on="draggable ? { mousedown } : {}"
  >
    <component v-for="component of children"
               :is="component.is"
               :key="component.key"
               v-bind="component"
    ></component>
  </v-group>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';

@Component
export default class Group extends Vue {
  @Prop(Object) public readonly config: object | undefined;
  @Prop(Array) public readonly children: object[] | undefined;
  @Prop(Boolean) public readonly draggable: boolean | undefined;
  @Prop(String) public readonly fullId: string | undefined;
  public mousedown(evt: { evt: MouseEvent, cancelBubble: boolean }) {
      evt.cancelBubble = true;
      if (this.fullId) {
          (this.$root.$children[0].$refs.graph as any).setDraggedIdAndPos(
              this.fullId, { x: evt.evt.pageX, y: evt.evt.pageY });
      }
  }
}
</script>
