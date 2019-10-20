import Vue from 'vue';
import Icon from 'vue-awesome/components/Icon.vue';
import VueKonva from 'vue-konva';
import App from './App.vue';

Vue.config.productionTip = false;

Vue.component('v-icon', Icon);
Vue.use(VueKonva);

new Vue({
  render: (h) => h(App),
}).$mount('#app');
