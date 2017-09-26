const Sequelize = require('sequelize');
const sequelize = require('../db');

const {
    GraphQLObjectType,
    GraphQLInputObjectType,
    GraphQLNonNull,
    GraphQLString,
    GraphQLID,
    GraphQLInt,
    GraphQLList,
} = require('graphql');

const User = {
  role: Sequelize.STRING,
  phoneNumber: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: {
      args: true,
      msg: 'Phone number already in use!',
    }
  },
  mobileId: Sequelize.STRING,
  orders: {
    type: Sequelize.STRING,
    defaultValue: '[]',
    get() {
      const orders = this.getDataValue('orders');
      return JSON.parse(orders);
    },
    set(val) {
      return this.setDataValue('orders', JSON.stringify(val));
    }
  },
  favoritePlaces: {
    type: Sequelize.STRING,
    defaultValue: '[]',
    get() {
      const places = this.getDataValue('favoritePlaces');
      return JSON.parse(places);
    },
    set(val) {
      return this.setDataValue('favoritePlaces', JSON.stringify(val));
    }
  },
  name: Sequelize.STRING,
  email: {
    type: Sequelize.STRING,
    validation: {
      isEmail: true,
      msg: 'Wrong email!',
    }
  },
  pw: {
    type: Sequelize.INTEGER,
    defaultValue: Math.floor(1000 + Math.random() * 9000),
  }
}

module.exports.UserModel = sequelize.define('users', User);

module.exports.UserType = new GraphQLObjectType({
  name: 'User',
  fields: {
    _id: {
      type: new GraphQLNonNull(GraphQLID)
    },
    id: {
      type: GraphQLInt
    },
    role: {
      type: GraphQLString
    },
    phoneNumber: {
      type: GraphQLString
    },
    mobileId: {
      type: GraphQLString
    },
    name: {
      type: GraphQLString
    },
    email: {
      type: GraphQLString
    },
    favoritePlaces: {
      type: new GraphQLList(GraphQLString)
    },
    orders: {
      type: new GraphQLList(GraphQLString)
    },
    pw: {
      type: GraphQLInt
    }
  }
});

module.exports.UserInput = new GraphQLInputObjectType({
  name: "UserInput",
  fields: {
    id: {
      type: GraphQLInt
    },
    role: {
      type: GraphQLString
    },
    phoneNumber: {
      type: GraphQLString
    },
    mobileId: {
      type: GraphQLString
    },
    name: {
      type: GraphQLString
    },
    email: {
      type: GraphQLString
    },
    favoritePlace: {
      type: new GraphQLList(GraphQLString)
    },
    order: {
      type: new GraphQLList(GraphQLString)
    },
    pw: {
      type: GraphQLInt
    },
  }
});
