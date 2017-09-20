const {
    GraphQLNonNull,
    GraphQLBoolean,
} = require('graphql');
const { UserModel, UserType, UserInput } = require('../../models/User');

const UserCreate = {
  description: "Create new user",
  type: GraphQLBoolean,
  args: {
    data: {
      name: "data",
      type: new GraphQLNonNull(UserInput)
    }
  },
  async resolve (root, params, options) {
    const userModel = new UserModel(params.data);
    const newUser = await userModel.save();
    if (!newUser) {
      throw new Error('Error adding new user');
    }
    return true;
  }
};

module.exports = {
    UserCreate: UserCreate,
}
