import React from 'react';
import { StyleSheet, Text, View, TextInput, Button, ScrollView, StatusBar, TouchableOpacity, Animated, } from 'react-native';

import { graphql, gql, compose } from 'react-apollo';

const authUser = gql`
  mutation AuthUser($phoneNumber: String!, $email: String!) {
    UserAuthRequest(data: { phoneNumber: $phoneNumber, email: $email })
  }
`

const loginWithPw = gql`
  mutation Login($phoneNumber: String!, $code: Int!) {
    LoginWithPw(data: { phoneNumber: $phoneNumber, pw: $code }) {
      id
      phoneNumber
      email
      favoritePlaces
      orders
      name
    }
  }
`

class AuthComponent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      userForm: {
        email: 'merkrow@gmail.com',
        phoneNumber: '+380930587010',
        code: '',
      },
      waitCode: false,
    }
  }

  registerUser = async () => {
    const { phoneNumber, email } = this.state.userForm;
    const res = await this.props.authUser({
      variables: { phoneNumber, email }
    })
    if (res.data.UserAuthRequest) {
      this.setState({ waitCode: true });
    }
  }

  sendCode = async () => {
    const { code, phoneNumber } = this.state.userForm;
    const res = await this.props.loginWithPw({
      variables: { phoneNumber, code: Number(code) }
    });
    if (res.data.LoginWithPw) {
      this.props.onComplete(res.data.LoginWithPw);
    }
  }

  render() {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center',backgroundColor: '#fff'}}>
        <View>
          <Text onPress={() => this.props.onComplete()}>Cancel</Text>
          <TextInput
            placeholder="phone number"
            style={{ borderWidth: 2, borderColor: !this.state.waitCode ? '#1492db' : '#ccc', marginTop: 10, padding: 5 }}
            onChangeText={(phoneNumber) => this.setState({ userForm: { ...this.state.userForm, phoneNumber }})}
            value={this.state.userForm.phoneNumber}
            editable={!this.state.waitCode}
          />
          <TextInput
            placeholder="email"
            style={{ borderWidth: 2, borderColor: !this.state.waitCode ? '#1492db' : '#ccc', marginTop: 10, padding: 5 }}
            onChangeText={(email) => this.setState({ userForm: { ...this.state.userForm, email }})}
            value={this.state.userForm.email}
            editable={!this.state.waitCode}
          />
          <View
            style={{ borderWidth: 2, borderColor: '#1492db', marginTop: 10 }}
          >
            <Button
              onPress={this.registerUser}
              title={ this.state.waitCode ? 'Resend' : 'Submit' }
            />
          </View>
          <TextInput
            placeholder="code"
            style={{ borderWidth: 2, borderColor: this.state.waitCode ? '#1492db' : '#ccc', marginTop: 10, padding: 5 }}
            onChangeText={(code) => this.setState({ userForm: { ...this.state.userForm, code }})}
            editable={this.state.waitCode}
            value={this.state.userForm.code}
          />
          <View
            style={{ borderWidth: 2, borderColor: this.state.waitCode ? '#1492db' : '#ccc', marginTop: 10 }}
          >
            <Button
              onPress={this.sendCode}
              title='Code'
            />
          </View>
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  menuRow: {
    color: '#fff',
  },
  menuText: {
    color: '#fff',
  },
});

const Auth = compose(graphql(authUser, { name: 'authUser' }), graphql(loginWithPw, { name: 'loginWithPw' }))(AuthComponent);

export default Auth;
