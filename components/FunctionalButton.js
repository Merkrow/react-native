import React, { Component } from 'react';
import { StyleSheet, Text, View, Button, TouchableOpacity, } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

export default class FB extends Component {
  render() {
    return (
      <TouchableOpacity
      onPress={this.props.onPress}
      style={[{
        position: 'absolute',
        right: 5,
        borderRadius: 50,
        height: 50,
        width: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }, this.props.buttonStyle]}>
        <Icon name={this.props.iconName} size={this.props.iconSize} color={this.props.iconColor} />
      </TouchableOpacity>
    )
  }
}
