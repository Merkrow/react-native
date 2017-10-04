import React from 'react';
import { StyleSheet, Text, View, TextInput, Button, ScrollView, StatusBar, TouchableOpacity, Animated, Dimensions, Alert, } from 'react-native';
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
      cost: 0,
    }
  }

  renderMarkerInfoRow(marker, i) {
    if (marker === null && i > this.props.lastField) return;
    const markersLength = this.props.markers.filter(marker => marker !== null).length;
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
        <View style={{ position: 'absolute', left: 5, top: 10, width: 40, height: 40, backgroundColor: i === 0 ? '#80f2b5' : i === markersLength - 1 ? '#e83a76' : '#61b2ed', borderRadius: 150, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 20, }}>{String.fromCharCode(65 + i)}</Text>
        </View>
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
    this.setState({ cost: this.props.cost });
  }

  componentDidUpdate(prevProps) {
    const order = this.props.findActiveOrder.ActiveOrder;
    if (order && prevProps.findActiveOrder.loading && !this.props.findActiveOrder.loading) {
      this.props.hasActiveOrder(order);
    }
    if (this.props.orderView !== prevProps.orderView && this.props.orderView) {
      Animated.timing(
        this.state.yPosition,
        {
          toValue: 75,
          duration: 1000,
        }
      ).start();
    } else if (!this.props.orderView) {
      Animated.timing(
        this.state.yPosition,
        {
          toValue: this.countTop(),
          duration: 1000,
        }
      ).start();
    }
    if (this.props.cost !== prevProps.cost) {
      this.setState({ cost: this.props.cost });
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

  increaseRate = () => {
    window.clearTimeout(this.timeout);
    this.setCountdown();
    if (this.state.cost + 5 === this.props.cost) {
      window.clearTimeout(this.timeout);
    }
    this.setState({ cost: this.state.cost + 5 });
  }

  decreaseRate = () => {
    window.clearTimeout(this.timeout);
    this.setCountdown();
    if (this.state.cost - 5 === this.props.cost) {
      window.clearTimeout(this.timeout);
    }
    this.setState({ cost: this.state.cost - 5 });
  }

  setCountdown = () => {
    this.timeout = window.setTimeout(this.confirmRateChange, 2000);
  }

  changeRate = () => {
    this.props.changeCost(this.state.cost);
  }

  confirmRateChange = () => {
    Alert.alert(
      'Confirm change?',
      'Are you sure you want to change rate?',
      [
        {text: 'No', onPress: () => this.setState({ cost: this.props.cost }), style: 'cancel'},
        {text: 'Yes', onPress: () => this.changeRate()},
      ]
    )
  }

  render() {
    return (
      <Animated.View style={[styles.markersList, { height: height - 75 }, this.topStyle()]}>
        <View style={{ backgroundColor: this.props.orderView ? '#1492db' : '#fff', }}>
          {this.props.markers.map(this.renderMarkerInfoRow.bind(this))}
        </View>
        <View style={styles.payment}>
        { this.props.markers.filter(marker => marker !== null).length > 1 &&
          <View style={{ width: 150, position: 'relative', height: 50 }}>
            <View style={{ width: 120, position: 'absolute', left: 20, alignItems: 'center' }}>
              <Text style={styles.cost}>{`${this.state.cost}uah`}</Text>
            </View>
            <TouchableOpacity onPress={this.decreaseRate} style={[styles.touchable, { left: 0, }]}>
              <Icon name="minus-circle" size={30} color="#1492db" style={{ width: 30, }} />
            </TouchableOpacity>
            <TouchableOpacity onPress={this.increaseRate} style={[styles.touchable, { right: 0 }]}>
              <Icon name="plus-circle" size={30} color="#1492db" style={{ width: 30, }} />
            </TouchableOpacity>
          </View> }
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
    paddingLeft: 50,
  },
  payment: {
    position: 'absolute',
    bottom: 60,
    height: 60,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    height: 40,
    backgroundColor: '#f5cc12',
    borderRadius: 4,
  },
  cost: {
    fontSize: 28,
  },
  touchable: {
     width: 20,
     position: 'absolute',
     top: 5
  }
});

const Order = compose(graphql(findActiveOrder, { name: 'findActiveOrder', options: props => ({ variables: { customerId: props.userId || null } }) }))(OrderComponent);

export default Order;
