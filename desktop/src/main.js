import Vue from 'vue';
import VueSocketio from 'vue-socket.io';
import Icon from 'vue-awesome/components/Icon';
import 'vue-awesome/icons';

import App from './App';
import config from '../config';

Vue.config.productionTip = false;
Vue.component('icon', Icon);

Vue.use(VueSocketio, config.server.api_url);
/* eslint-disable no-new */
new Vue({
  el: '#app',
  template: '<App/>',
  components: { App },
});
