const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const koaRouter = require('koa-router');
const koaBody = require('koa-bodyparser');
const IO = require('koa-socket');

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

app._io.on('connection', (socket) => {
  socket.on('cancel order by customer', async (order) => {
    try {
      await OrderModel.update(Object.assign(order, { status: 'cancel' }), { where: { id: order.id } });
    } catch (err) {
      console.log(err);
    }
    app._io.emit(`cancel order ${order.id}`, true);
  })

  socket.on('get all orders', async () => {
    try {
      const Orders = await OrderModel.findAll({ where: { status: 'active' } });
      socket.emit('allOrders', Orders);
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
        socket.emit('order created', newOrder);
        app._io.emit('addOrder', newORder);
    } catch(err) {
      console.log(err);
    }
  })
})


async function start() {
  const connection = await db.sync();
  if(connection) {
    app.listen(3000);
    console.log('connected to database and listening on port 3000');
  }
};

start();
