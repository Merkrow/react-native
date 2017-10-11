<template>
  <div class="orders-list">
    <h1 class="header">Orders: </h1>
    <div v-for="order in orders" class="order">
      <div class="order-header">
        <button v-if="order.status === 'active'" @click="acceptOrder(order)" class="accept-button"><icon name="check" class="check"></icon></button>
        <button v-if="order.status === 'acceptByDriver'" @click="cancelOrder(order)" class="reject-button"><icon name="close" class="close"></icon></button>
        <div class="status">{{ order.status }}</div>
        <div class="path">
          <div v-for="path in order.path" class="marker">
            <div class="address">{{ `${path.description.split(', ')[0]}, ${path.description.split(', ')[1]}` }}</div>
            <div class="city">{{ path.description.split(', ')[2] }}</div>
          </div>
        </div>
      </div>
      <div class="order-footer">
        <div class="date">{{ getDate(order.createdAt) }}</div>
        <div class="cost">{{ `${order.cost}₴` }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import * as moment from 'moment';
import Polyline from '@mapbox/polyline';

export default {
  name: 'orders',
  data() {
    return {
      orders: [],
      driverPosition: null,
      intervals: {},
    };
  },
  sockets: {
    connect() {
      this.$socket.emit('get all orders');
    },
    allOrders(data) {
      this.orders = data;
    },
    newOrder(order) {
      this.orders.push(order);
    },
    updateOrder(order) {
      this.orders = this.orders.map((prev) => {
        if (prev.id === order.id) {
          return order;
        }
        return prev;
      });
    },
    cancelOrder(id) {
      this.orders = this.orders.filter(order => order.id !== id);
      clearInterval(this.intervals[id]);
    },
    getPath({ path, order }) {
      const points = Polyline.decode(path.routes[0].overview_polyline.points);
      const coords = points.map(point => ({
        latitude: point[0],
        longitude: point[1],
      }));
      this.driverPosition = coords;
      let i = 0;
      this.intervals[order.id] = setInterval(() => {
        if (i === coords.length - 1) {
          this.$socket.emit('car arrived', order);
          clearInterval(this.intervals[order.id]);
          return;
        }
        this.$socket.emit('driver position', { coordinate: coords[i], id: order.id });
        i += 1;
      }, 2000);
    },
  },
  methods: {
    getDate(date) {
      const format = moment(date).format('DD MMM HH:MM');
      return format;
    },
    cancelOrder(order) {
      this.$socket.emit('reject order by driver', order);
    },
    acceptOrder(order) {
      this.$socket.emit('accept order by driver', order);
      this.fetchRoad(order);
    },
    fetchRoad(order) {
      const rand = (Math.random() + 0.5) * 0.02;
      const { longitude, latitude } = order.path[0].coordinate;
      const destinationLoc = `${latitude}, ${longitude}`;
      const startLoc = `${latitude - rand}, ${longitude - rand}`;
      this.$socket.emit('get path', { destinationLoc, startLoc, order });
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .header {
    height: 50px;
    font-size: 40px;
    margin-bottom: 20px;
    padding-left: 40px;
  }

  .orders-list {
    height: 100vh;
    overflow-y: scroll;
    background-color: #e8eae8;
    margin: 0;
    padding: 0;
  }

  .order {
    min-height: 150px;
    background-color: #fff;
    margin: 20px;
    border-radius: 5px;
  }
  .order:hover {
    background-color: #3ce86c;
    cursor: pointer;
  }

  .path {
    display: inline-block;
    margin: 20px 0 0 150px;
  }

  .status {
    position: absolute;
    left: 0;
    top: 50%;
  }

  button {
    outline: none;
  }

  .order-header {
    border-bottom: 1px solid #e8eae8;
    padding-bottom: 20px;
    position: relative;
  }

  .order-footer {
    height: 50px;
    position: relative;
  }

  .address {
    font-size: 20px;
    color: #000;
    margin: 0;
    padding: 0;
    margin-top: 5px;
  }

  .date {
    font-size: 18px;
    font-weight: bold;
    margin-left: 150px;
    margin-top: 15px;
  }

  .cost {
    position: absolute;
    right: 150px;
    top: 0;
    font-size: 18px;
    font-weight: bold;
    display: inline-block;
    color: #7f827f;
  }

  .accept-button {
    border-radius: 100%;
    border: none;
    height: 50px;
    width: 50px;
    background-color: #2bc42b;
    position: absolute;
    right: 150px;
    top: 50px;
  }

  .city {
    color: #b0b2b0;
  }

  .check {
    height: 30px;
    width: 30px;
    color: #fff;
    cursor: pointer;
    margin-top: 5px;
  }

  .reject-button {
    border-radius: 100%;
    border: none;
    height: 50px;
    width: 50px;
    background-color: #e23b28;
    position: absolute;
    right: 90px;
    top: 50px;
  }

  .close {
    height: 30px;
    width: 30px;
    color: #fff;
    cursor: pointer;
    margin-top: 5px;
  }

  .reject-button:hover {
    background-color: #ff1900;
  }

  .accept-button:hover {
    background-color: #80fcdf;
  }

</style>
