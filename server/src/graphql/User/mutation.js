const {
    GraphQLNonNull,
    GraphQLBoolean,
    GraphQLID,
    GraphQLString,
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
    console.log('aaa');
    const newUser = await UserModel.update(params.data, {
        where: { id : params.data.id },
      });
    return UserModel.findById(params.data.id);
  }
}

const UserAuthRequest = {
  description: "Auth user request",
  type: GraphQLBoolean,
  args: {
    data: {
      name: "data",
      type: new GraphQLNonNull(UserInput)
    },
  },
  async resolve(root, params, options) {
    const User = await UserModel.findOne({ where: { phoneNumber: params.data.phoneNumber }});
    if (User) {
      const newUser = await User.update({ pw: Math.floor(1000 + Math.random() * 9000) });
      const send = require('gmail-send')({
        user: 'react.native.taxi@gmail.com',
        pass: 'qawsed123',
        to: `${newUser.email}`,
        subject: 'password to login',
        text: `Your code is ${newUser.pw}`,
      })();
      return true;
    } else {
      const userModel = new UserModel(params.data);
      const newUser = await userModel.save();
      const send = require('gmail-send')({
        user: 'react.native.taxi@gmail.com',
        pass: 'qawsed123',
        to: `${newUser.email}`,
        subject: 'password to login',
        text: `Your code is ${newUser.pw}`,
      })();
      return true;
    }
  }
}

const LoginWithPw = {
  description: "Login user with pw",
  type: UserType,
  args: {
    data: {
      name: "data",
      type: new GraphQLNonNull(UserInput)
    },
  },
  async resolve(root, params, options) {
    const User = await UserModel.findOne({ where: { phoneNumber: params.data.phoneNumber }});
    if (User.pw === params.data.pw) {
      return User;
    } else {
      throw new Error("Code doesn't match!");
    }
  }
}

module.exports = {
    UserCreate,
    UserUpdate,
    UserAuthRequest,
    LoginWithPw,
}
