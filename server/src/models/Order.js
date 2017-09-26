const Sequelize = require('sequelize');
const sequelize = require('../db');

const {
    GraphQLObjectType,
    GraphQLInputObjectType,
    GraphQLNonNull,
    GraphQLString,
    GraphQLID,
    GraphQLList,
    GraphQLInt,
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
  },
  status: Sequelize.STRING,
  driverId: Sequelize.STRING,
  customerId: Sequelize.STRING,
  cost: Sequelize.STRING,
}

const Coordinate = new GraphQLObjectType({
  name: 'Coordinate',
  fields: {
    longitude: {
      type: GraphQLString
    },
    latitude: {
      type: GraphQLString
    },
  }
});

const OrderMarker = new GraphQLObjectType({
  name: 'OrderMarker',
  fields: {
    coordinate: {
      type: Coordinate
    },
    description: {
      type: GraphQLString
    }
  }
});

module.exports.OrderModel = sequelize.define('orders', Order);

module.exports.OrderType = new GraphQLObjectType({
  name: 'Order',
  fields: {
    _id: {
      type: new GraphQLNonNull(GraphQLID)
    },
    path: {
      type: new GraphQLList(OrderMarker)
    },
    status: {
      type: GraphQLString
    },
    customerId: {
      type: GraphQLInt
    },
    driverId: {
      type: GraphQLInt
    },
    cost: {
      type: GraphQLString
    }
  }
});

const CoordinateInput = new GraphQLInputObjectType({
  name: 'CoordinateInput',
  fields: {
    longitude: {
      type: GraphQLString
    },
    latitude: {
      type: GraphQLString
    },
  }
});

const OrderMarkerInput = new GraphQLInputObjectType({
  name: 'OrderMarkerInput',
  fields: {
    coordinate: {
      type: CoordinateInput
    },
    description: {
      type: GraphQLString
    }
  }
});

module.exports.OrderInput = new GraphQLInputObjectType({
  name: "OrderInput",
  fields: {
    path: {
      type: new GraphQLList(OrderMarkerInput)
    },
    status: {
      type: GraphQLString
    },
    customerId: {
      type: GraphQLInt
    },
    driverId: {
      type: GraphQLInt
    },
    cost: {
      type: GraphQLString
    }
  }
});
