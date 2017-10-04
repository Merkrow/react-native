import Vue from 'vue';
import VueSocketio from 'vue-socket.io';

import App from './App';
import config from '../config';

Vue.config.productionTip = false;

Vue.use(VueSocketio, config.server.api_url);
/* eslint-disable no-new */
new Vue({
  el: '#app',
  template: '<App/>',
  components: { App },
});
