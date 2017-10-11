import React, { Component } from 'react';
import { StyleSheet, Text, View, Button, TouchableOpacity, Animated, Linking, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const { width, height } = Dimensions.get('window');

export default class Menu extends Component {
  render() {
    return (
      <Animated.View style={[{ width: 250, right: this.props.xPosition - width, top: 0, bottom: 0, backgroundColor: '#2f2f30', position: 'absolute', }]}>
        <View style={{ height: 75, backgroundColor: '#1492db', }}>
          { this.props.user ?
            <Text
              style={{ position: 'absolute', right: 10, bottom: 10 }}
              onPress={this.props.logout}>
              <Icon name="sign-out" size={30} color="#fff" style={{ width: 30 }} />
            </Text> :
            <Text style={{ position: 'absolute', top: 30, left: 30, fontSize: 16, }} onPress={this.props.toggleAuthForm}>Sign in</Text>
          }
          { this.props.user ?
            <Text
              style={{ position: 'absolute', bottom: 10, left: 10, }}
              onPress={this.props.toggleProfile}>
              <Icon name="user-circle" size={40} color="#fff" style={{ width: 40 }} />
                <Text style={{ color: '#fff', marginLeft: 30 }}>{ this.props.user.phoneNumber }</Text>
            </Text> : null
          }
        </View>
        <TouchableOpacity onPress={this.props.triggerOrdersList} style={styles.menuRow}>
          <Icon name="bookmark" size={25} color="#1492db" style={styles.menuIcon} />
          <Text style={styles.menuText}>My trips</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL('mailto:react.native.taxi@gmail.com?subject=Support&body=body')} style={styles.menuRow}>
          <Icon name="support" size={25} color="#1492db" style={styles.menuIcon} />
          <Text style={styles.menuText}>Service Support</Text>
        </TouchableOpacity>
      </Animated.View>
    )
  }
}

const styles = StyleSheet.create({
  menuRow: {
    position: 'relative',
  },
  menuIcon: {
    width: 25,
    left: 10,
    position: 'absolute',
    top: 12
  },
  menuText: {
    color: '#fff',
    height: 50,
    lineHeight: 50,
    marginLeft: 70,
  }
});
