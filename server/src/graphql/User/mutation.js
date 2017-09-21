const {
    GraphQLNonNull,
    GraphQLBoolean,
    GraphQLID,
} = require('graphql');
const { UserModel, UserType, UserInput } = require('../../models/User');

const UserCreate = {
  description: "Create new user",
  type: GraphQLBoolean,
  args: {
    data: {
      name: "data",
      type: new GraphQLNonNull(UserInput)
    },
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

const UserUpdate = {
  description: "Update user",
  type: UserType,
  args: {
    data: {
      name: "data",
      type: new GraphQLNonNull(UserInput)
    },
  },
  async resolve (root, params, options) {
    await UserModel.update(params.user, {
        where: { id : params.user.id }
      });
    return UserModel.findById(params.user.id);
  }
}

module.exports = {
    UserCreate,
    UserUpdate,
}
