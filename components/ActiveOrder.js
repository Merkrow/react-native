import React from 'react';
import { StyleSheet, Text, View, TextInput, Button, StatusBar, TouchableOpacity, Animated, Dimensions, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const { width, height } = Dimensions.get('window');

class ActiveOrderComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      timerTime: 600,
    }
  }

  componentDidMount() {
    this.props.socket.on(`cancel order ${this.props.order.id}`, res => {
      if (res) {
        this.props.cancelOrder();
      }
    })
    this.props.socket.emit('get timer', this.props.order);
    this.props.socket.on('timer response', timer => {
      this.setState({ timerTime: timer });
    });
    this.interval = window.setInterval(this.timerCountdown, 1000);
  }

  componentWillUnmount() {
    window.clearInterval(this.interval);
  }

  cancelOrder = () => {
    Alert.alert(
      'Cancel order',
      'Are you sure you want to cancel order?',
      [
        {text: 'Yes', onPress: () => this.props.socket.emit('cancel order by customer', this.props.order)},
        {text: 'No', onPress: () => console.log('Cancel Pressed'), style: 'cancel'},
      ]
    )
  }

  getAddress = (description) => {
    const arr = description.split(', ');
    return `${arr[0]}, ${arr[1]}`;
  }

  timerCountdown = () => {
    const { timerTime } = this.state;
    this.setState({ timerTime: timerTime - 1 });
  }

  countTime = () => {
    const { timerTime } = this.state;
    const min = Math.floor(timerTime / 60);
    const sec = timerTime % 60;
    return (min < 10 ? "0" + min : min) + ":" + (sec < 10 ? "0" + sec : sec);
  }

  render() {
    return (
      <View style={styles.activeOrder}>
        <View style={styles.addresses}>
          <View style={styles.orderInfo}>
            <Text style={{ fontSize: 20, color: '#fff' }}>Car search</Text>
            <Text style={{ fontSize: 13, color: '#fff', marginTop: 5, }}>Please wait until the driver confirms the order</Text>
            <View style={styles.path}>
              { this.props.order.path.map((marker, i) => <Text style={styles.address} key={i}>{ this.getAddress(marker.description) }</Text>) }
            </View>
          </View>
        </View>
        <View style={styles.parameters}>
          <View style={styles.cost}>
            <Text style={{ fontSize: 20 }}>{ `${this.props.order.cost}UAH` }</Text>
          </View>
          <View style={styles.cancel}>
            <Text style={{ position: 'absolute', alignItems: 'center', bottom: 80, fontSize: 20, fontWeight: 'bold' }} >{ this.countTime() }</Text>
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
                position: 'absolute',
                bottom: 20,
              }}
            >
              <Icon name="close" size={20} color="#fff" style={{ width: 20 }} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  activeOrder: {
    flex: 1,
    backgroundColor: '#fff',
    position: 'relative',
  },
  addresses: {
    backgroundColor: '#1492db',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 200,
  },
  orderInfo: {
    marginTop: 40,
    marginLeft: 80,
  },
  path: {
    marginTop: 30,
  },
  address: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  cost: {
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#1492db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  parameters: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: height - 200,
  },
  cancel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  }
});

export default ActiveOrderComponent;
