const {
    GraphQLObjectType,
    GraphQLSchema
} = require('graphql');

const User = require('./graphql/User');

module.exports = new GraphQLSchema({
    query: new GraphQLObjectType({
        name: 'Query',      // произвольное имя для API библитеки
        fields: User.queries, // поля из файла queries.js
    }),
    mutation: new GraphQLObjectType({
        name: 'Mutation',
        fields: User.mutation,
    })
});
