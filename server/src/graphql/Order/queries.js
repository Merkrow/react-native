const {
    GraphQLID,
    GraphQLList,
    GraphQLNonNull
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
module.exports = {
  Order,
  Orders,
}
