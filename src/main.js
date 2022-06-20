import Vue from 'vue'
import App from './App.vue'
import VueKonva from 'vue-konva';
import Toaster from 'v-toaster';
import 'v-toaster/dist/v-toaster.css';
Vue.use(VueKonva);
import { BootstrapVue, BootstrapVueIcons } from 'bootstrap-vue'

// Import Bootstrap and BootstrapVue CSS files (order is important)
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
Vue.use(Toaster, { timeout: 3000 });
// Make BootstrapVue available throughout your project
Vue.use(BootstrapVue)
// Optionally install the BootstrapVue icon components plugin
Vue.use(BootstrapVueIcons)


new Vue({
  el: '#app',
  render: h => h(App)
})
