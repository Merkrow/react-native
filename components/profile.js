import React from 'react';
import { StyleSheet, Text, View, TextInput, Button, ScrollView, StatusBar, TouchableOpacity, Animated, Dimensions, } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

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

const { width, height } = Dimensions.get('window');

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

  onComplete = () => {
    this.props.onComplete();
  }

  render() {
    return (
      <View>
        <View style={{ height: 75, backgroundColor: '#1492db', }}>
          <View>
            <Icon onPress={() => this.onComplete()} name="close" size={20} color="#fff" style={{ width: 20, position: 'absolute', left: 15, top: 45 }} />
          </View>
          <View>
            <Icon onPress={() => this.updateUser()} name="save" size={30} color="#fff" style={{ width: 30, position: 'absolute', right: 15, top: 40 }} />
          </View>
          <View style={{position: 'absolute', top: 35, left: 100, right: 100, bottom: 0, justifyContent: 'center', alignItems: 'center'}}>
            <Text style={{ color: '#fff', fontSize: 20 }}>Profile</Text>
          </View>
        </View>
        <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', height: height - 75, }}>
          <View style={{ position: 'relative', height: 50, width: 300 }}>
            <Icon name="phone" size={30} color="#1492db" style={styles.menuIcon} />
            <TextInput
              value={this.state.userForm.phoneNumber}
              style={styles.textInput}
              onChangeText={(phoneNumber) => this.setState({ userForm: { ...this.state.userForm, phoneNumber }})}
            />
          </View>
          <View style={{ position: 'relative', height: 50, width: 300 }}>
            <Icon name="user-circle" size={30} color="#1492db" style={styles.menuIcon} />
            <TextInput
              value={this.state.userForm.name}
              style={styles.textInput}
              onChangeText={(name) => this.setState({ userForm: { ...this.state.userForm, name }})}
            />
          </View>
          <View style={{ position: 'relative', height: 50, width: 300 }}>
            <Icon name="envelope-o" size={30} color="#1492db" style={styles.menuIcon} />
            <TextInput
              value={this.state.userForm.email}
              style={styles.textInput}
              onChangeText={(email) => this.setState({ userForm: { ...this.state.userForm, email }})}
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
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    marginTop: 10,
    padding: 5,
    position: 'absolute',
    left: 60,
    right: 30,
  },
  menuIcon: {
    width: 30,
    position: 'absolute',
    left: 0,
    top: 10
  }
});

const Profile = compose(graphql(updateUser, { name: 'updateUser' }))(ProfileComponent);

export default Profile;
