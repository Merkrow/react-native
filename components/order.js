import React, { Component } from 'react';
import { StyleSheet, Text, View, TextInput, Button, ScrollView, StatusBar, TouchableOpacity, Animated, Dimensions, Alert, } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

import { graphql, gql, compose } from 'react-apollo';
import findActiveOrder from '../graphql/orders/findActiveOrder';

const { width, height } = Dimensions.get('window');

class OrderComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      yPosition: new Animated.Value(height),
      cost: 0,
    }
  }

  renderMarkers = () => {
    const { addOneMoreAddress, markers, addNextField, orderView } = this.props;
    let renderMarkers = markers;
    while (renderMarkers.length < 5) {
      renderMarkers = renderMarkers.concat(null);
    }
    return (
      <View style={{ backgroundColor: orderView ? '#1492db' : '#fff', }}>
        { renderMarkers.map((marker, i) => this.renderMarkerInfoRow(marker, i)) }
      </View>
    )
  }

  renderMarkerInfoRow(marker = null, i) {
    const { markers, addOneMoreAddress } = this.props;
    const markersLength = markers.length;
    if (marker === null && i > 1 && i >= markersLength + (+addOneMoreAddress)) return;
    if (marker === null) {
      return (
        <View key={i} style={styles.markersListItem}>
          <Text style={[styles.markersListText, { color: this.props.orderView ? '#fff' : '#bababa' }]} onPress={() => this.props.openAutocomplete(i)}>{i === 0 ? 'From' : 'To'}</Text>
          <View style={{ position: 'absolute', left: 5, top: 10, width: 40, height: 40, backgroundColor: i === 0 ? '#80f2b5' : i === markersLength - 1 ? '#e83a76' : '#61b2ed', borderRadius: 150, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 20, }}>{String.fromCharCode(65 + i)}</Text>
          </View>
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
        { i === 0 || i < markersLength - 1 + (+addOneMoreAddress) || i === 4 ?
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
          }}><Icon name="close" size={20} color="#ccc" style={{ width: 20, color: this.props.orderView ? '#fff' : '#000' }} /></Text> : null
        }
        { i === markersLength - 1 + (+addOneMoreAddress) && i !== 0 && i !== 4 &&
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
      this.props.hideSpinner();
      this.props.hasActiveOrder(order);
    }
    if (!order && prevProps.findActiveOrder.loading && !this.props.findActiveOrder.loading) {
      this.props.hideSpinner();
    }
    if (this.props.orderView !== prevProps.orderView && this.props.orderView) {
      Animated.timing(
        this.state.yPosition,
        {
          toValue: 75,
          duration: 250,
        }
      ).start();
    } else if (!this.props.orderView) {
      Animated.timing(
        this.state.yPosition,
        {
          toValue: this.countTop(),
          duration: 250,
        }
      ).start();
    }
    if (this.props.cost !== prevProps.cost) {
      this.setState({ cost: this.props.cost });
    }
  }

  countTop = () => {
    const { markers, addOneMoreAddress } = this.props;
    const markersLength = markers.length;
    if (this.props.order !== null) {
      return height;
    }
    return height - 112 - (markersLength < 2 ? 0 : (markersLength - 2) * 56) - (+addOneMoreAddress) * 56;
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
        { this.renderMarkers() }
        <View style={styles.payment}>
        { this.props.markers.length > 1 &&
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
    paddingLeft: 65,
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
