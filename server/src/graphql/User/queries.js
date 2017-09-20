const {
    GraphQLID,
    GraphQLList,
    GraphQLNonNull
} = require('graphql');

const { UserModel, UserType, UserInput } = require('../../models/User');

const User = {
  type: UserType,
  args: {
    id: {
      name: 'id',
      type: new GraphQLNonNull(GraphQLID)
    }
  },
  resolve (root, params, options) {
    return UserModel
      .findById(params.id);
  }
};
const Users = {
  type: new GraphQLList(UserType),
  args: {},
  resolve (root, params, options) {
    return UserModel
      .findAll()
      .then(users => users);
  }
};
module.exports = {
  User: User,
  Users: Users,
}
