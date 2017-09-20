const Sequelize = require('sequelize');
const sequelize = require('../db');

const {
    GraphQLObjectType,
    GraphQLInputObjectType,
    GraphQLNonNull,
    GraphQLString,
    GraphQLID
} = require('graphql');

const User = {
  role: Sequelize.STRING,
  phoneNumber: Sequelize.STRING,
}

module.exports.UserModel = sequelize.define('users', User);

module.exports.UserType = new GraphQLObjectType({
    name: 'User',
    fields: {
        _id: {
            type: new GraphQLNonNull(GraphQLID)
        },
        role: {
            type: GraphQLString
        },
        phoneNumber: {
            type: GraphQLString
        }
    }
});

module.exports.UserInput = new GraphQLInputObjectType({
    name: "UserInput",
    fields: {
        role: {
            type: GraphQLString
        },
        phoneNumber: {
            type: GraphQLString
        }
    }
});
