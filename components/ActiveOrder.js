import React from 'react';
import { StyleSheet, Text, View, TextInput, Button, StatusBar, TouchableOpacity, Animated, } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

import { graphql, gql, compose } from 'react-apollo';

class ActiveOrderComponent extends React.Component {
  constructor(props) {
    super(props);

  }

  componentDidMount() {
    this.props.socket.on(`cancel order ${this.props.order.id}`, res => {
      if (res) {
        this.props.cancelOrder();
      }
    })
  }

  cancelOrder = () => {
    this.props.socket.emit('cancel order by customer', this.props.order);
  }

  render() {
    return (
      <View style={styles.activeOrder}>
        <View style={styles.addresses}>
          <View style={styles.orderInfo}>
            <Text>Car search</Text>
            <Text>Please wait until the driver confirms the order</Text>
            <View style={styles.path}>
              { this.props.order.path.map((marker, i) => <Text key={i}>{ marker.description }</Text>) }
            </View>
          </View>
        </View>
        <View style={styles.cost}>
          <Text>{ this.props.order.cost }</Text>
        </View>
        <View style={styles.cancel}>
          <TouchableOpacity
            onPress={this.cancelOrder}
            style={{
              borderRadius: 50,
              backgroundColor: '#f00',
              height: 50,
              width: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="close" size={20} color="#fff" style={{ width: 20 }} />
          </TouchableOpacity>
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  activeOrder: {
    flex: 1,
    backgroundColor: '#fff',
  },
  addresses: {
    height: '60%',
    backgroundColor: '#1492db',
  },
  orderInfo: {
    marginTop: 40,
    marginLeft: 40,
  },
  path: {
    marginTop: 30,
  },
  cost: {
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#1492db',
  },
  cancel: {
  }
});

// const Order = compose(graphql(findActiveOrder, { name: 'findActiveOrder', options: props => ({ variables: { customerId: props.user.id } }) }))(OrderComponent);

export default ActiveOrderComponent;
