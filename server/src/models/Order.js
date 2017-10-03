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
    GraphQLFloat,
} = require('graphql');

const Order = {
  path: {
    type: Sequelize.TEXT,
    get: function() {
      return JSON.parse(this.getDataValue('path'));
    },
    set: function(val) {
      return this.setDataValue('path', JSON.stringify(val));
    },
  },
  status: {
    type: Sequelize.STRING,
    defaultValue: 'active',
  },
  driverId: Sequelize.INTEGER,
  customerId: Sequelize.INTEGER,
  cost: {
    type: Sequelize.INTEGER,
  },
}

const Coordinate = new GraphQLObjectType({
  name: 'Coordinate',
  fields: {
    longitude: {
      type: GraphQLFloat
    },
    latitude: {
      type: GraphQLFloat
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
    id: {
      type: GraphQLInt
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
      type: GraphQLInt
    }
  }
});

const CoordinateInput = new GraphQLInputObjectType({
  name: 'CoordinateInput',
  fields: {
    longitude: {
      type: GraphQLFloat
    },
    latitude: {
      type: GraphQLFloat
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
    id: {
      type: GraphQLInt
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
      type: GraphQLInt
    }
  }
});
