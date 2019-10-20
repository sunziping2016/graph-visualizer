<template>
  <v-group :config="config">
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
}
</script>
