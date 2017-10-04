<template>
  <div id="app">
    <orders></orders>
  </div>
</template>

<script>
import Orders from './components/Orders';

export default {
  name: 'app',
  components: {
    Orders,
  },
};
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin: 0;
  padding: 0;
}
body {
  margin: 0;
  padding: 0;
}
</style>
