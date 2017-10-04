import React from 'react';
import { StyleSheet, Text, View, TextInput, Button, ScrollView, StatusBar, TouchableOpacity, Animated, Dimensions, } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

import { graphql, gql, compose } from 'react-apollo';

const { width, height } = Dimensions.get('window');

const findOrders = gql`
  query orders($orders: [String]){
    findUserOrders(orders: $orders) {
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

class TripsComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      orders: [],
    }
  }

  componentDidMount() {
  }

  componentDidUpdate() {

  }

  onComplete = () => {
    this.props.onComplete();
  }

  render() {
    if (this.props.findOrders.loading) {
      return (
        <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
          <Text>Loading</Text>
        </View>
      )
    }
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Icon onPress={() => this.onComplete()} name="close" size={20} color="#fff" style={{ width: 20, position: 'absolute', left: 15, top: 45 }} />
          </View>
        </View>
        <ScrollView style={styles.ordersContainer}>
          <Text style={{ fontSize: 20, margin: 5, }}>My trips</Text>
          { this.props.findOrders.findUserOrders.map((order, i) =>
            <View key={i} style={styles.order}>
              <View style={{ borderBottomWidth: 1, borderBottomColor: '#f2f4f7' }}>
                <View style={{
                  backgroundColor: order.status === 'cancel' ? '#fc876a' : '#96f77e',
                  borderRadius: 150, width: 35, height: 35,
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  position: 'absolute',
                  left: 10,
                  top: 20,
                }}>
                  { order.status === 'cancel' ?
                    <Icon name="close" size={20} color="#fff" style={{ width: 20, }} /> :
                    <Icon name="check" size={20} color="#fff" style={{ width: 20, }} />
                  }
                </View>
                <View style={{ marginLeft: 55, marginBottom: 10, marginTop: 5 }}>
                  { order.path.map((place, j) =>
                    <Text style={{ marginTop: 10, fontSize: 16 }} key={`${j} ${i}`}>{ `${place.description.split(', ')[0]}, ${place.description.split(', ')[1]}` }</Text>) }
                </View>
              </View>
              <Text style={{ position: 'absolute', right: 10, bottom: 10, color: '#b1b2b0', fontSize: 16 }}>{ `${order.cost}uah` }</Text>
            </View>
          )}
        </ScrollView>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 75,
    backgroundColor: '#1492db',
  },
  ordersContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 75,
    bottom: 0,
    backgroundColor: '#f2f4f7',
  },
  order: {
    minHeight: 120,
    margin: 5,
    backgroundColor: '#fff',
    borderRadius: 5,
    overflow: 'hidden',
    position: 'relative',
  }
});

const Trips = compose(graphql(findOrders, { name: 'findOrders', options: props => ({ variables: { orders: props.orders } }) }))(TripsComponent);

export default Trips;
