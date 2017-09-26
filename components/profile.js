import React from 'react';
import { StyleSheet, Text, View, TextInput, Button, ScrollView, StatusBar, TouchableOpacity, Animated, } from 'react-native';

import { graphql, gql, compose } from 'react-apollo';

const updateUser = gql`
  mutation Update($email: String, $name: String, $phoneNumber: String, $id: Int) {
    UserUpdate(data: { email: $email, name: $name, phoneNumber: $phoneNumber, id: $id }) {
      id
      phoneNumber
      email
      favoritePlaces
      orders
      name
    }
  }
`

class ProfileComponent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      userForm: {
        email: '',
        phoneNumber: '',
        name: '',
      },
    }
    this.updateUser = this.updateUser.bind(this);
  }

  componentDidMount() {
    const { email, name, phoneNumber } = this.props.user;
    this.setState({ userForm: { email, phoneNumber, name }});
  }

  async updateUser() {
    const { name, email, phoneNumber } = this.state.userForm;
    const { id } = this.props.user;
    const res = await this.props.updateUser({
      variables: { email, name, phoneNumber, id }
    });
    if (res.data.UserUpdate) {
      this.props.onComplete(res.data.UserUpdate);
    }
  }

  render() {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center',backgroundColor: '#fff'}}>
        <View>
          <Text onPress={() => this.props.onComplete()}>Cancel</Text>
          <TextInput
            value={this.state.userForm.phoneNumber}
            style={{ borderWidth: 2, borderColor: '#1492db', marginTop: 10, padding: 5, width: 300 }}
            onChangeText={(phoneNumber) => this.setState({ userForm: { ...this.state.userForm, phoneNumber }})}
          />
          <TextInput
            value={this.state.userForm.name}
            style={{ borderWidth: 2, borderColor: '#1492db', marginTop: 10, padding: 5, width: 300 }}
            onChangeText={(name) => this.setState({ userForm: { ...this.state.userForm, name }})}
          />
          <TextInput
            value={this.state.userForm.email}
            style={{ borderWidth: 2, borderColor: '#1492db', marginTop: 10, padding: 5, width: 300 }}
            onChangeText={(email) => this.setState({ userForm: { ...this.state.userForm, email }})}
          />
          <View
            style={{ borderWidth: 2, borderColor: '#1492db', marginTop: 10 }}
          >
            <Button
              onPress={this.updateUser}
              title='Update'
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

const Profile = compose(graphql(updateUser, { name: 'updateUser' }))(ProfileComponent);

export default Profile;
