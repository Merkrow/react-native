<template>
  <ul>
    <li v-for="order in orders">
      {{ order.id }}
    </li>
  </ul>
</template>

<script>
export default {
  name: 'orders',
  data() {
    return {
      orders: [],
    };
  },
  sockets: {
    connect() {
      this.$socket.emit('get all orders');
    },
    allOrders(data) {
      this.orders = data;
    },
    addOrder(order) {
      console.log('aaa');
      this.orders.push(order);
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
