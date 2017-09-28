const {
    GraphQLNonNull,
    GraphQLBoolean,
} = require('graphql');
const { OrderModel, OrderType, OrderInput } = require('../../models/Order');

const OrderCreate = {
  description: "Create new order",
  type: OrderType,
  args: {
    data: {
      name: "data",
      type: new GraphQLNonNull(OrderInput)
    }
  },
  async resolve (root, params, options) {
    console.log(params.data);
    const orderModel = new OrderModel(params.data);
    const newOrder = await orderModel.save();
    if (!newOrder) {
      throw new Error('Error adding new order');
    }
    return newOrder;
  }
};

module.exports = {
    OrderCreate,
}
