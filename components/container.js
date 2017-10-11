import React from 'react';
import { StyleSheet, Text, View, TextInput, Button, StatusBar, TouchableOpacity, Animated, AsyncStorage, Linking, Dimensions, Alert, } from 'react-native';
import MapView from 'react-native-maps';
import Polyline from '@mapbox/polyline';
import { graphql, gql, compose } from 'react-apollo';
import io from 'socket.io-client';
import Icon from 'react-native-vector-icons/FontAwesome';
import Spinner from 'react-native-loading-spinner-overlay';

import config from '../config/config';

import Auth from './auth';
import Profile from './profile';
import Order from './order';
import ActiveOrder from './ActiveOrder';
import Trips from './trips';
import FB from './FunctionalButton';
import Menu from './Menu';

import createOrder from '../graphql/orders/createOrder';
import updateUser from '../graphql/users/updateUser';

import { GooglePlacesAutocomplete } from './autocomplete';

const API_KEY = 'AIzaSyB01muOUPXMrSoNJYQVS3aXaNgKQF-b9zA';
const mode = 'driving';

const DELTA = {
  latitudeDelta: 0.004622,
  longitudeDelta: 0.00681,
}

const { width, height } = Dimensions.get('window');

class Container extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      region: Object.assign({}, DELTA, { latitude: 37.78825, longitude: -122.4324, }),
      userCoordinates: {},
      selector: {},
      markers: [],
      polylines: [],
      search: '',
      selectedInput: null,
      addOneMoreAddress: false,
      showMenu: false,
      xPosition: new Animated.Value(0),
      fadeAnim: new Animated.Value(0),
      showAuthForm: false,
      user: null,
      showProfile: false,
      order: null,
      orderView: false,
      distance: 0,
      cost: 30,
      ordersList: false,
      driverCoordinates: null,
      spinnerVisible: false
    }

    this.socket = io(`${config.api_url}`, { transports: ['websocket'] });
  }

  onCompleteAuth = (user) => {
    if (user) {
      this.updateUser(user);
    }
    this.toggleAuthForm();
  }

  updateUser = (user) => {
    this.setState({ user });
    this.saveUser(user);
  }

  saveUser = async (user) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      throw new Error('Error saving user!');
    }
  }

  getUser = async () => {
    try {
      const user = await AsyncStorage.getItem('user');
      if (user !== null) {
        this.setState({ user: JSON.parse(user) });
      }
    } catch(error) {
      throw new Error('Error gettin user!');
    }
  }

  async getDirections(startLoc, destinationLoc) {
    try {
      const resp = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${startLoc}&destination=${destinationLoc}&key=${API_KEY}&mode=${mode}`
      );
      const respJson = await resp.json();
      const points = Polyline.decode(respJson.routes[0].overview_polyline.points);
      const distance = respJson.routes[0].legs[0].distance.value;
      const coords = points.map((point, index) => {
        return  {
          latitude : point[0],
          longitude : point[1],
        }
      })
      this.setState({ polylines: this.state.polylines.concat({ coords: coords }), distance: this.state.distance + distance });
      return coords;
    } catch(error) {
      return error;
    }
  }

  async getAddress(coordinate) {
    try {
      const resp = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinate}&key=${API_KEY}&language=ru&components=route`
      );
      const respJson = await resp.json();
      return respJson.results[0].formatted_address;
    } catch(error) {
      return error;
    }
  }

  setCurrentPos() {
    navigator.geolocation.getCurrentPosition(pos => {
      this.setState({
        userCoordinates: {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        },
      });
    });
  }

  showSpinner = () => {
    this.setState({ spinnerVisible: true });
  }

  hideSpinner = () => {
    this.setState({ spinnerVisible: false })
  }

  async componentDidMount() {
    this.showSpinner();
    window.setInterval(this.setCurrentPos.bind(this), 10000);
    await this.getUser();
    navigator.geolocation.getCurrentPosition(pos => {
      const coords = Object.assign({}, DELTA, {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      this.setState({
        region: coords,
        userCoordinates: {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        },
      });
    });
    this.socket.on('order created', async (order) => {
      this.setOrder(order);
      const { email, name, phoneNumber, id, orders } = this.state.user
      const resUser = await this.props.updateUser({
        variables: { email, name, phoneNumber, id, orders: orders.concat(order.id) }
      });
      if (resUser.data.UserUpdate) {
        this.updateUser(resUser.data.UserUpdate);
      }
    })
  }

  onRegionChange = (region) => {
    this.setState({ region, });
  }

  setPolylines(arr) {
    this.setState({ distance: 0 });
    arr.reduce((prev, curr) => {
      if (prev === null) return curr;
      const { latitude, longitude } = prev.coordinate;
      this.getDirections(`${latitude}, ${longitude}`, `${curr.coordinate.latitude}, ${curr.coordinate.longitude}`);
      return curr;
    }, null);
  }

  onMapPress = async (marker) => {
    const { latitude, longitude } = marker.coordinate;
    const address = await this.getAddress(`${latitude}, ${longitude}`);
    this.setState({ selector: Object.assign(marker, { description: address } ) });
  }

  autocompletePress = async (data, details) => {
    const { lat, lng } = details.geometry.location;
    const description = await this.getAddress(`${lat}, ${lng}`);

    this.map.animateToRegion(Object.assign({}, DELTA, {
        latitude: lat,
        longitude: lng,
      }), 500);
    this.setState({
      selector:
        { coordinate:
          { longitude: lng, latitude: lat },
          description
        },
    });
    return data;
  }

  addMarker = (marker) => {
    const { markers } = this.state;
    if (markers.length > 4) return;
    const newMarkers = markers.concat(marker);
    this.setState({ markers: newMarkers, selector: {}, });
    if (newMarkers.length > 1) {
      this.setPolylines(newMarkers);
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.distance !== this.state.distance) {
      this.countCost();
    }
  }

  addMarkerByIndex = (marker, index) => {
    const { markers } = this.state;
    const newMarkers = markers.map((prev, i) => i === index ? marker : prev);
    this.setState({ markers: newMarkers });
    if (newMarkers.length > 1) {
      this.setPolylines(newMarkers);
    }
  }

  onRemoveTextPress = (index) => {
    const { markers } = this.state;
    const newMarkers = markers.filter((marker, i) => i !== index);
    this.setState({ markers: newMarkers, polylines: [], });
    if (newMarkers.length < 2) {
      this.setState({ distance: 0, cost: 30, addOneMoreAddress: false });
    }
    return newMarkers.length > 1 ? this.setPolylines(newMarkers) : null;
  }

  openAutocomplete = (i, marker = null) => {
    this.setState({ selectedInput: { index: i, marker }});
  }

  addOneMoreAddress = () => {
    this.setState({ addOneMoreAddress: true });
  }

  goToUserLocation = () => {
    this.setState({ region:
      Object.assign({}, this.state.userCoordinates, DELTA)
    });
  }

  triggerMenu = () => {
    if (!this.state.showMenu) {
      Animated.timing(
        this.state.xPosition,
        {
          toValue: 250,
          duration: 250,
        }
      ).start();
    } else {
      Animated.timing(
        this.state.xPosition,
        {
          toValue: 0,
          duration: 250,
        }
      ).start();
    }
    this.setState({ showMenu: !this.state.showMenu });
  }

  onAucompletePressIndex = async (data, details) => {
    const { lat, lng } = details.geometry.location;
    const { index } = this.state.selectedInput;
    const description = await this.getAddress(`${lat}, ${lng}`);
    this.map.animateToRegion(Object.assign({}, DELTA, {
        latitude: lat,
        longitude: lng,
      }), 500);
    this.addMarkerByIndex({ coordinate: { longitude: lng, latitude: lat }, description }, index)
    this.setState({
      selector:
        { coordinate:
          { longitude: lng, latitude: lat },
          description
        },
      selectedInput: null,
    });
    return data;
  }

  blurAutocomplete = () => {
    this.setState({ selectedInput: null });
  }

  toggleAuthForm = () => {
    this.setState({ showAuthForm: !this.state.showAuthForm });
  }

  logout = () => {
    this.setState({ user: null });
    AsyncStorage.removeItem('user');
  }

  toggleProfile = () => {
    this.setState({ showProfile: !this.state.showProfile });
  }

  onUserUpdateComplete = (user) => {
    if (user) {
      this.updateUser(user);
    }
    this.toggleProfile();
  }

  cancelOrder = () => {
    this.setState({ order: null });
  }

  countCost = () => {
    const { distance } = this.state;
    let cost = Math.round(distance * 0.015);
    cost = cost < 30 ? 30 : cost;
    this.setState({ cost });
  }

  orderTaxi = async () => {
    this.showSpinner();
    const markers = this.state.markers.map(marker => ({ coordinate: marker.coordinate, description: marker.description }));
    if (markers.length < 2 || !this.state.user) return;
    const { cost } = this.state;
    this.toggleOrderView();

    this.socket.emit('create order', { path: markers, customerId: this.state.user.id, cost });
  }

  toggleOrderView = () => {
    if (!this.state.orderView) {
      Animated.timing(
        this.state.fadeAnim,
        {
          toValue: 1,
          duration: 250,
        }
      ).start();
      this.setState({ orderView: !this.state.orderView })
    } else {
      Animated.timing(
        this.state.fadeAnim,
        {
          toValue: 0,
          duration: 250,
        }
      ).start();
      setTimeout(() => this.setState({ orderView: !this.state.orderView }), 250);
    }
  }

  hasActiveOrder = (order) => {
    const { path } = order;
    this.setOrder(order);
    this.setPolylines(path);
  }

  setOrder = (order) => {
    const { path } = order;
    this.socket.on(`driver position ${order.id}`, (coordinate) => {
      this.setState({ driverCoordinates: coordinate });
    })
    this.socket.on(`car arrived ${order.id}`, order => {
      if (order) {
        this.setState({ order });
      }
    })
    this.socket.on(`update order ${order.id}`, (order) => {
      this.setState({ order });
    })
    this.setState({ order, markers: path, spinnerVisible: false });
  }

  changeCost = (cost) => {
    this.setState({ cost });
  }

  triggerOrdersList = () => {
    this.setState({ ordersList: true, spinnerVisible: true });
  }

  onOrdersListFinish = () => {
    this.setState({ ordersList: false });
  }

  goToDriverLocation = () => {
    if (this.state.driverCoordinates === null) {
      return;
    }
    this.setState({ region:
      Object.assign({}, this.state.driverCoordinates, DELTA)
    });
  }

  enterTaxi = () => {
    this.socket.emit('enter taxi', this.state.order);
  }

  finishRide = () => {
    this.socket.emit('finish ride', this.state.order);
    this.setState({ order: null, markers: new Array(null, null, null, null, null), selector: {}, polylines: [], cost: 30 });
  }

  cancel = () => {
    Alert.alert(
      'Cancel order',
      'Are you sure you want to cancel order?',
      [
        {text: 'Yes', onPress: () => this.socket.emit('cancel order by customer', this.state.order)},
        {text: 'No', onPress: () => console.log('Cancel Pressed'), style: 'cancel'},
      ]
    )
    this.socket.on(`cancel order ${this.state.order.id}`, res => {
      if (res) {
        this.cancelOrder();
      }
    })
  }

  renderOrderFB = () => {
    const { order, addOneMoreAddress } = this.state;
    const { markers } = this.state;
    const markersLength = markers.length;

    if (order === null) {
      return (
        <FB
          buttonStyle={{
            bottom: 130 + (markersLength < 2 ? 0 : (markersLength - 2) * 56) + (+addOneMoreAddress) * 56,
            backgroundColor: '#f5cc12',
          }}
          iconName="long-arrow-right" iconSize={27} iconColor="#000"
          onPress={this.toggleOrderView}
        />)
    }
    if (order.status === "acceptByDriver" && order.status !== 'taxiRiding') {
      return (
        <FB
          buttonStyle={{
            bottom: 130,
            backgroundColor: '#f5cc12',
          }}
          iconName="cab" iconSize={22} iconColor="#000"
          onPress={this.goToDriverLocation}
        />
      )
    }
    if (order.status !== 'taxiRiding') {
      return (
        <FB
          buttonStyle={{
            bottom: 130,
            backgroundColor: '#f5cc12',
          }}
          iconName="sign-in" iconSize={22} iconColor="#000"
          onPress={this.enterTaxi}
        />
      )
    }
    return (
      <FB
        buttonStyle={{
          bottom: 130,
          backgroundColor: '#f5cc12',
        }}
        iconName="sign-out" iconSize={22} iconColor="#000"
        onPress={this.finishRide}
      />
    )
  }

  render() {
    const { latitude, longitude } = this.state.region;
    const { userCoordinates, markers, addOneMoreAddress } = this.state;
    const markersLength = markers.length;
    return (
      <View style={styles.container}>
        <Menu
          xPosition={this.state.xPosition}
          toggleProfile={this.toggleProfile}
          user={this.state.user}
          triggerOrdersList={this.triggerOrdersList}
          toggleAuthForm={this.toggleAuthForm}
          logout={this.logout}
        />
        <Animated.View style={[styles.mapView, { width, left: this.state.xPosition, top: 0, right: 0, bottom: 0, }]}>
          <MapView
            ref={(map) => this.map = map}
            style={[styles.map, { bottom: 0 }]}
            showsCompass={false}
            onRegionChange={this.onRegionChange}
            initialRegion={this.state.region}
            region={this.state.region}
            onPress={e => this.onMapPress(e.nativeEvent)}
          >
            {this.state.polylines.map((line, i) => (
              <MapView.Polyline
                key={`line ${i}`}
                coordinates={line.coords}
                strokeWidth={4}
                strokeColor="red"/>
            ))}
            {this.state.driverCoordinates && this.state.order && this.state.order.status === "acceptByDriver" &&
              <MapView.Marker
                coordinate={this.state.driverCoordinates}
              >
                <Icon name="cab" size={20} color="#f5cc12" />
              </MapView.Marker>
            }
            {Object.keys(this.state.selector).length > 0 &&
              <MapView.Marker
                coordinate={this.state.selector.coordinate}
                onPress={e => e.stopPropagation()}
                onCalloutPress={e => {e.stopPropagation();}}
                showCallout={true}
              >
              <View style={{
                height: 30,
                width: 30,
                backgroundColor: '#e83a76',
                borderTopRightRadius: 150,
                borderTopLeftRadius: 150,
                borderBottomLeftRadius: 150,
                overflow: 'hidden',
                alignItems: 'center',
                justifyContent: 'center',
                transform: [{ rotate: '45deg' }],
                marginBottom: 30
              }}>
              </View>
                <MapView.Callout {...this.state.selector}>
                  <View style={{ position: 'relative', }}>
                    <Text style={{ marginRight: 30, }}>{`${this.state.selector.description.split(', ')[0]}, ${this.state.selector.description.split(', ')[1]}`}</Text>
                    { markersLength > 4 ? null :
                      <View
                      style={{
                        position: 'absolute',
                        borderWidth: 1,
                        right: 0,
                        borderRadius: 100,
                        borderColor: '#e1e1e1',
                        height: 20,
                        width: 20,
                      }}>
                      <Text onPress={() => this.addMarker(this.state.selector)} style={{ backgroundColor: 'rgba(0, 0, 0, 0)', fontSize: 20, textAlign: 'center', color: '#1492db', padding: 0, margin: 0, lineHeight: 20, }}>+</Text></View>
                    }
                  </View>
                </MapView.Callout>
              </MapView.Marker>
            }
            {this.state.markers.map((marker, i) => {
              if (!marker) return;
                return (
                  <MapView.Marker
                    key={i}
                    description={`${marker.description.split(', ')[0]}, ${marker.description.split(', ')[1]}`}
                    coordinate={marker.coordinate}
                    onPress={e => e.stopPropagation()}
                  >
                    <View style={{
                      height: 30,
                      width: 30,
                      backgroundColor: i === 0 ? '#80f2b5' : i === markersLength - 1 ? '#e83a76' : '#61b2ed',
                      borderTopRightRadius: 150,
                      borderTopLeftRadius: 150,
                      borderBottomLeftRadius: 150,
                      overflow: 'hidden',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transform: [{ rotate: '45deg' }],
                      marginBottom: 30
                    }}>
                      <Text style={{ color: '#fff', fontSize: 20, transform: [{ rotate: '315deg' }] }}>{String.fromCharCode(65 + i)}</Text>
                    </View>
                  </MapView.Marker>
                );
              }
            )}
            {Object.keys(this.state.userCoordinates).length > 0 &&
              <View>
                <MapView.Circle center={userCoordinates} radius={50} fillColor='rgba(151, 196, 239, 0.5)' strokeWidth={1} strokeColor='rgba(151, 196, 239, 0.5)' />
                <MapView.Marker coordinate={userCoordinates}>
                  <View
                  style={{
                    height: 20,
                    width: 20,
                    backgroundColor: '#428ff4',
                    borderRadius: 10,
                    borderWidth: 3,
                    borderColor: '#fff',
                    borderStyle: 'solid',
                  }} />
                </MapView.Marker>
              </View>
            }
          </MapView>
          <View style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: 75,
            flex: 0,
            backgroundColor: '#fff'
          }}>
            <Text onPress={this.triggerMenu} style={{ position: 'absolute', left: 20, top: 41, color: '#000', }}>
              <Icon name="gear" size={30} color="#1492db" style={{ width: 30 }} />
            </Text>
            <GooglePlacesAutocomplete
              placeholder='Search'
              minLength={2}
              filterReverseGeocodingByTypes={['address']}
              query={{
                key: API_KEY,
                language: 'en',
                types: 'geocode',
                location: `${latitude}, ${longitude}`,
                radius: 50000,
              }}
              debounce={200}
              fetchDetails={true}
              autoFocus={false}
              styles={{
                container: {
                  flex: 0,
                  backgroundColor: '#fff',
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 0
                },
                textInputContainer: {
                  backgroundColor: '#fff',
                  borderTopWidth: 0,
                  borderBottomWidth: 0,
                },
              }}
              onPress={this.autocompletePress}
            />
          </View>
          <FB buttonStyle={{ bottom: 200 + (markersLength < 2 ? 0 : (markersLength - 2) * 56) + (+addOneMoreAddress) * 56, backgroundColor: '#fff', }}
            iconName="location-arrow" iconSize={35} iconColor="#1492db"
            onPress={this.goToUserLocation}
          />
          { this.state.order === null &&
            <View style={{
              position: 'absolute',
              right: 25,
              width: 170,
              height: 45,
              bottom: 135 + (markersLength < 2 ? 0 : (markersLength - 2) * 56) + (+addOneMoreAddress) * 56,
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              borderRadius: 100,
            }}>
              <Text style={{ fontSize: 18, marginLeft: 10 }}>from<Text style={{ fontSize: 25, fontWeight: 'bold' }}>{` ${this.state.cost}`}</Text>UAH</Text>
            </View>
          }
          { this.renderOrderFB() }
          <Order
            openAutocomplete={this.openAutocomplete}
            onRemoveTextPress={this.onRemoveTextPress}
            addNextField={this.addOneMoreAddress}
            user={this.state.user}
            userId={this.state.user !== null && this.state.user.id}
            markers={this.state.markers}
            addOneMoreAddress={this.state.addOneMoreAddress}
            hasActiveOrder={this.hasActiveOrder}
            orderView={this.state.orderView}
            toggleOrderView={this.toggleOrderView}
            orderTaxi={this.orderTaxi}
            cost={this.state.cost}
            changeCost={this.changeCost}
            order={this.state.order}
            hideSpinner={this.hideSpinner}
          />
        </Animated.View>
        { this.state.orderView && <Animated.View style={[styles.header, { opacity: this.state.fadeAnim }]}>
            <Text style={{ marginTop: 30, marginLeft: 20, width: 40 }} onPress={() => this.toggleOrderView()}><Icon name="angle-down" size={35} color="#fff" /></Text>
          </Animated.View> }
          { this.state.selectedInput ?
            <GooglePlacesAutocomplete
              placeholder='Search'
              minLength={2}
              filterReverseGeocodingByTypes={['address']}
              query={{
                key: API_KEY,
                language: 'en',
                types: 'geocode',
                location: `${latitude}, ${longitude}`,
                radius: 50000,
              }}
              getDefaultValue={() => {
                const { marker, index } = this.state.selectedInput;
                return !marker ? '' : marker.description;
              }}
              fetchDetails={true}
              autoFocus={true}
              styles={{
                container: {
                  backgroundColor: '#fff',
                },
                textInputContainer: {
                  backgroundColor: '#fff',
                  borderTopWidth: 0,
                  borderBottomWidth: 0,
                  height: 75,
                  position: 'relative',
                  borderBottomColor: '#dad9de',
                  borderBottomWidth: 1,
                },
              }}
              nearbyPlacesAPI='GoogleReverseGeocoding'
              onPress={this.onAucompletePressIndex}
              closeAutocomplete={this.blurAutocomplete}
            /> :
            null
          }
        { this.state.showAuthForm && <Auth onComplete={this.onCompleteAuth} /> }
        { this.state.showProfile && <Profile onComplete={this.onUserUpdateComplete} user={this.state.user}/> }
        { this.state.order !== null && this.state.order.status === 'active' && <ActiveOrder socket={this.socket} cancelOrder={this.cancelOrder} order={this.state.order} /> }
        { this.state.ordersList && this.state.user !== null && <Trips orders={this.state.user.orders} hideSpinner={this.hideSpinner} onComplete={this.onOrdersListFinish} /> }
        <Spinner spinnerVisible={this.state.spinnerVisible} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  mapView: {
    position: 'absolute',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 75,
    backgroundColor: '#1492db',
  },
  map: {
    left: 0,
    right: 0,
    top: 75,
    position: 'absolute',
  },
});

const ContainerComponent = compose(
  graphql(createOrder, { name: 'createOrder' }),
  graphql(updateUser, { name: 'updateUser' })
)(Container);

export default ContainerComponent;
