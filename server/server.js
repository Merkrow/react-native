const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const koaRouter = require('koa-router');
const koaBody = require('koa-bodyparser');
const IO = require('koa-socket');
const needle = require('needle');

const schema = require('./src/schema');
const db = require('./src/db');
const { OrderModel } = require('./src/models/Order');

// CORS
const cors = require('koa2-cors');

// GraphQL Needed
const { graphqlKoa, graphiqlKoa } = require('graphql-server-koa');
const graphql = require('graphql');

// Koa APP
const app = new Koa();
const io = new IO();
const router = new koaRouter()

app.use(koaBody());

app.use(cors());

router.post('/graphql', graphqlKoa({schema: schema}));
router.get('/graphql', graphqlKoa({schema: schema}));
router.get('/graphiql', graphiqlKoa({endpointURL: '/graphql'}));

app.use(router.routes());
app.use(router.allowedMethods());

io.attach(app);

const API_KEY = 'AIzaSyB01muOUPXMrSoNJYQVS3aXaNgKQF-b9zA';
const mode = 'driving';

process.setMaxListeners(500);
require('events').EventEmitter.prototype._maxListeners = 500;

const timers = {};
const values = {};

app._io.on('connection', (socket) => {
  socket.on('cancel order by customer', async (order) => {
    try {
      await OrderModel.update(Object.assign(order, { status: 'cancel' }), { where: { id: order.id } });
    } catch (err) {
      console.log(err);
    }
    socket.emit(`cancel order ${order.id}`, true);
    app._io.emit('cancelOrder', order.id);
    clearInterval(timers[order.id]);
    delete values[order.id];
  })

  socket.on('get all orders', async () => {
    try {
      const Orders = await OrderModel.findAll({ where: { $not: { status: ['cancel', 'done'] } } });
      app._io.emit('allOrders', Orders);
    } catch(err) {
      console.log(err);
    }
  })

  socket.on('create order', async (order) => {
    try {
      const orderModel = new OrderModel(order);
      const newOrder = await orderModel.save();
      if (!newOrder) {
        throw new Error('Error adding new order');
      }
      setTimer(newOrder.dataValues);
      app._io.emit('newOrder', newOrder);
      socket.emit('order created', newOrder);
    } catch(err) {
      console.log(err);
    }
  })

  socket.on('accept order by driver', async (order) => {
    try {
      await OrderModel.update(Object.assign(order, { status: 'acceptByDriver' }), { where: { id: order.id }});
      const newOrder = await OrderModel.findById(order.id);
      socket.emit('updateOrder', newOrder);
      app._io.emit(`update order ${order.id}`, newOrder);
      clearInterval(timers[order.id]);
      delete values[order.id];
    } catch(err) {
      console.log(err);
    }
  })

  socket.on('get path', async ({ startLoc, destinationLoc, order }) => {
      needle('get', `https://maps.googleapis.com/maps/api/directions/json?origin=${startLoc}&destination=${destinationLoc}&key=${API_KEY}&mode=${mode}`)
      .then((resp) => {
        socket.emit('getPath', { path: resp.body, order });
      });
  })

  socket.on('enter taxi', async (order) => {
    await OrderModel.update(Object.assign(order, { status: 'taxiRiding' }), { where: { id: order.id }});
    const newOrder = await OrderModel.findById(order.id);
    socket.emit(`update order ${order.id}`, newOrder);
    app._io.emit('updateOrder', newOrder);
  })

  socket.on('driver position', ({ coordinate, id }) => {
    app._io.emit(`driver position ${id}`, coordinate);
  })

  socket.on('finish ride', async (order) => {
    await OrderModel.update(Object.assign(order, { status: 'done' }), { where: { id: order.id }});
    app._io.emit('cancelOrder', order.id);
  })

  socket.on('car arrived', async (order) => {
    await OrderModel.update(Object.assign(order, { status: 'carArrived' }), { where: { id: order.id }});
    const newOrder = await OrderModel.findById(order.id);
    app._io.emit(`car arrived ${order.id}`, newOrder);
  })

  socket.on('reject order by driver', async (order) => {
    await OrderModel.update(Object.assign(order, { status: 'active' }), { where: { id: order.id }});
    const newOrder = await OrderModel.findById(order.id);
    app._io.emit('updateOrder', newOrder);
    app._io.emit(`update order ${order.id}`, newOrder);
  })

  socket.on('get timer', (order) => {
    socket.emit('timer response', values[order.id]);
  })

  const setTimer = (order) => {
    values[order.id] = 600;
    timers[order.id] = setInterval(() => {
      values[order.id] -= 1;
      if (values[order.id] === 0) {
        delete values[order.id];
        OrderModel.update(Object.assign(order, { status: 'cancel' }), { where: { id: order.id } });
        app._io.emit(`cancel order ${order.id}`, true);
        app._io.emit('cancelOrder', order.id);
      }
    }, 1000);
  }

})


const start = async () => {
  const connection = await db.sync();
  if(connection) {
    app.listen(3000);
    console.log('connected to database and listening on port 3000');
  }
};

start();
