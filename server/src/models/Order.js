const Sequelize = require('sequelize');
const sequelize = require('../db');

const {
    GraphQLObjectType,
    GraphQLInputObjectType,
    GraphQLNonNull,
    GraphQLString,
    GraphQLID
} = require('graphql');

const Order = {
  path: {
    type: Sequelize.STRING,
    get: function() {
      return JSON.parse(this.getDataValue('myArrayField'));
    },
    set: function(val) {
      return this.setDataValue('myArrayField', JSON.stringify(val));
    },
  }
}

module.exports.OrderModel = sequelize.define('orders', Order);

module.exports.OrderType = new GraphQLObjectType({
    name: 'Order',
    fields: {
        _id: {
            type: new GraphQLNonNull(GraphQLID)
        },
        path: {
            type: GraphQLString
        },
    }
});

module.exports.OrderInput = new GraphQLInputObjectType({
    name: "OrderInput",
    fields: {
        path: {
            type: GraphQLString
        },
    }
});
