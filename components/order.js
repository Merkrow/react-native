import React from 'react';
import { StyleSheet, Text, View, TextInput, Button, ScrollView, StatusBar, TouchableOpacity, Animated, } from 'react-native';

import { graphql, gql, compose } from 'react-apollo';

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

  }

  componentDidMount() {
  }

  componentDidUpdate() {
    const order = this.props.findActiveOrder.ActiveOrder;
    if (order) {
      this.props.hasActiveOrder(order);
    }
  }

  render() {
    return (
      <View>

      </View>
    )
  }
}

const styles = StyleSheet.create({

});

const Order = compose(graphql(findActiveOrder, { name: 'findActiveOrder', options: props => ({ variables: { customerId: props.user.id } }) }))(OrderComponent);

export default Order;
