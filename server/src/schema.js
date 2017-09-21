const {
    GraphQLObjectType,
    GraphQLSchema
} = require('graphql');

const { User, Order } = require('./graphql');

module.exports = new GraphQLSchema({
    query: new GraphQLObjectType({
        name: 'Query',
        fields: Object.assign({}, Order.queries, User.queries),
    }),
    mutation: new GraphQLObjectType({
        name: 'Mutation',
        fields: Object.assign({}, Order.mutation, User.mutation),
    })
});
