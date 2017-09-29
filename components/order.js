import React from 'react';
import { StyleSheet, Text, View, TextInput, Button, ScrollView, StatusBar, TouchableOpacity, Animated, Dimensions, } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

import { graphql, gql, compose } from 'react-apollo';

const { width, height } = Dimensions.get('window');

const findActiveOrder = gql`
  query findActive($customerId: Int){
    ActiveOrder(customerId: $customerId) {
      id
      customerId
      driverId
      cost
      status
      path {
        coordinate {
          latitude
          longitude
        }
        description
      }
    }
  }
`

class OrderComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      yPosition: new Animated.Value(height),
    }
  }

  renderMarkerInfoRow(marker, i) {
    if (marker === null && i > this.props.lastField) return;
    if (marker === null) {
      return (
        <View key={i} style={styles.markersListItem}>
          <Text style={[styles.markersListText, { color: this.props.orderView ? '#fff' : '#bababa' }]} onPress={() => this.props.openAutocomplete(i)}>{i === 0 ? 'From' : 'To'}</Text>
        </View>
      )
    }
    const address = marker.description.split(', ');
    return (
      <View key={i} style={styles.markersListItem}>
        <Text style={[styles.markersListText, { color: this.props.orderView ? '#fff' : '#000'}]} onPress={() => this.props.openAutocomplete(i, marker)}>{`${address[0]}, ${address[1]}`}</Text>
        {this.props.markers[i + 1] !== null || i === 0 || this.props.lastField > i ?
          <Text
          onPress={() => this.props.onRemoveTextPress(i)}
          style={{
            textAlign: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0)',
            fontSize: 25,
            color: '#1492db',
            position: 'absolute',
            right: 10,
            top: 17,
          }}><Icon name="close" size={20} color="#ccc" style={{ width: 20, color: this.props.orderView ? '#fff' : '#000' }} /></Text> :
          <Text
          onPress={() => this.props.addNextField()}
          style={{
            textAlign: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0)',
            fontSize: 25,
            color: '#1492db',
            position: 'absolute',
            right: 10,
            top: 17,
          }}><Icon name="plus-circle" size={20} color="#ccc" style={{ width: 20, color: this.props.orderView ? '#fff' : '#000' }} /></Text>
        }
      </View>
    )
  }

  componentDidMount() {
  }

  componentDidUpdate() {
    const order = this.props.findActiveOrder.ActiveOrder;
    if (order) {
      this.props.hasActiveOrder(order);
    }
    if (this.props.orderView) {
      Animated.timing(
        this.state.yPosition,
        {
          toValue: 75,
          duration: 1000,
        }
      ).start();
    } else {
      Animated.timing(
        this.state.yPosition,
        {
          toValue: this.countTop(),
          duration: 1000,
        }
      ).start();
    }
  }

  countTop = () => {
    const { markers } = this.props;
    const listLength = markers.filter(marker => marker !== null).length;
    return height - 112 - (listLength <= 2 ? 0 : listLength - 2) * 56 - (this.props.lastField - 1) * 56;
  }

  topStyle = () => {
    if (this.props.orderView) {
      return {
        top: this.state.yPosition
      }
    } else {
      return {
        top: this.state.yPosition,
      }
    }
  }

  submitOrder = () => {
    this.props.orderTaxi();
  }

  render() {
    return (
      <Animated.View style={[styles.markersList, { height: height - 75 }, this.topStyle()]}>
        <View style={{ backgroundColor: this.props.orderView ? '#1492db' : '#fff', }}>
          {this.props.markers.map(this.renderMarkerInfoRow.bind(this))}
        </View>
        <View style={styles.payment}>

        </View>
        <View style={styles.button}>
          <Button
            title='ORDER A TAXI'
            onPress={this.submitOrder}
            color='#000'
          />
        </View>
      </Animated.View>
    )
  }
}

const styles = StyleSheet.create({
  markersList: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: '#dad9de',
    backgroundColor: '#fff',
  },
  markersListItem: {
    position: 'relative',
  },
  markersListText: {
    height: 56,
    lineHeight: 55,
    fontSize: 15,
    paddingLeft: 15,
  },
  payment: {
    position: 'absolute',
    bottom: 60,
    height: 50,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  button: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    height: 40,
    backgroundColor: '#f5cc12',
    borderRadius: 4,
  }
});

const Order = compose(graphql(findActiveOrder, { name: 'findActiveOrder', options: props => ({ variables: { customerId: props.userId || null } }) }))(OrderComponent);

export default Order;
