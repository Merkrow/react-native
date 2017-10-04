const {
    GraphQLID,
    GraphQLList,
    GraphQLNonNull,
    GraphQLInt,
    GraphQLString,
} = require('graphql');

const { OrderModel, OrderType, OrderInput } = require('../../models/Order');

const Order = {
  type: OrderType,
  args: {
    id: {
      name: 'id',
      type: new GraphQLNonNull(GraphQLID)
    }
  },
  resolve (root, params, options) {
    return OrderModel
      .findById(params.id);
  }
};
const Orders = {
  type: new GraphQLList(OrderType),
  args: {},
  resolve (root, params, options) {
    return OrderModel
      .findAll();
  }
};

const ActiveOrder = {
  type: OrderType,
  args: {
    customerId: {
      name: "customerId",
      type: GraphQLInt
    }
  },
  resolve (root, params, options) {
    return OrderModel.findOne({ where: { customerId: params.customerId, status: ['active', 'acceptByDriver'] }});
  }
}

const findUserOrders = {
  type: new GraphQLList(OrderType),
  args: {
    orders: {
      name: "orders",
      type: new GraphQLList(GraphQLString)
    }
  },
  resolve (root, params, options) {
    return OrderModel.findAll({ where: { id: params.orders }});
  }
}

module.exports = {
  Order,
  Orders,
  ActiveOrder,
  findUserOrders,
}
