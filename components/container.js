import React from 'react';
import { StyleSheet, Text, View, TextInput, Button, StatusBar, TouchableOpacity, Animated, AsyncStorage, Linking, Dimensions, } from 'react-native';
import MapView from 'react-native-maps';
import Polyline from '@mapbox/polyline';
import { graphql, gql, compose } from 'react-apollo'
import PropTypes from 'prop-types';
import io from 'socket.io-client';
import Icon from 'react-native-vector-icons/FontAwesome';

import config from '../config/config';

import Auth from './auth';
import Profile from './profile';
import Order from './order';
import ActiveOrder from './ActiveOrder';

import { GooglePlacesAutocomplete } from './autocomplete';

const API_KEY = 'AIzaSyB01muOUPXMrSoNJYQVS3aXaNgKQF-b9zA';
const mode = 'driving';

const createOrder = gql`
  mutation order($path: [OrderMarkerInput], $customerId: Int, $cost: Int) {
    OrderCreate(data: { path: $path, customerId: $customerId, cost: $cost }) {
      customerId
      cost
      status
      id
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

const updateUser = gql`
  mutation Update($email: String, $name: String, $phoneNumber: String, $id: Int, $orders: [String]) {
    UserUpdate(data: { email: $email, name: $name, phoneNumber: $phoneNumber, id: $id, orders: $orders }) {
      id
      phoneNumber
      email
      favoritePlaces
      orders
      name
    }
  }
`

const { width, height } = Dimensions.get('window');

class Container extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      region: {
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.004622,
        longitudeDelta: 0.00681
      },
      userCoordinates: {},
      selector: {},
      markers: new Array(null, null, null, null, null),
      polylines: [],
      search: '',
      selectedInput: null,
      lastField: 1,
      showMenu: false,
      xPosition: new Animated.Value(0),
      fadeAnim: new Animated.Value(0),
      showAuthForm: false,
      user: null,
      showProfile: false,
      order: null,
      socket: null,
      orderView: false,
      distance: 0,
      cost: 30,
    }

    this.socket = io(`${config.api_url}`, { transports: ['websocket'] });

    this.onRegionChange = this.onRegionChange.bind(this);
    this.onMapPress = this.onMapPress.bind(this);
    this.onMarkerPress = this.onMarkerPress.bind(this);
    this.autocompletePress = this.autocompletePress.bind(this);
    this.onAucompletePressIndex = this.onAucompletePressIndex.bind(this);
    this.blurAutocomplete = this.blurAutocomplete.bind(this);
    this.triggerMenu = this.triggerMenu.bind(this);
    this.onCompleteAuth = this.onCompleteAuth.bind(this);
    this.saveUser = this.saveUser.bind(this);
    this.getUser = this.getUser.bind(this);
  }

  onCompleteAuth(user) {
    if (user) {
      this.updateUser(user);
    }
    this.toggleAuthForm();
  }

  updateUser = (user) => {
    this.setState({ user });
    this.saveUser(user);
  }

  async saveUser(user) {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      throw new Error('Error saving user!');
    }
  }

  async getUser() {
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
      let resp = await fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${ startLoc }&destination=${ destinationLoc }&key=${API_KEY}&mode=${mode}`)
      let respJson = await resp.json();
      let points = Polyline.decode(respJson.routes[0].overview_polyline.points);
      const distance = respJson.routes[0].legs[0].distance.value;
      let coords = points.map((point, index) => {
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
      let resp = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinate}&key=${API_KEY}&language=ru&components=route`)
      let respJson = await resp.json();
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

  async componentDidMount() {
    window.setInterval(this.setCurrentPos.bind(this), 10000);
    await this.getUser();

    navigator.geolocation.getCurrentPosition(pos => {
      const coords = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        latitudeDelta: 0.004622,
        longitudeDelta: 0.00681,
      };
      this.setState({
        region: coords,
        userCoordinates: {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        },
      });
    });
  }

  onRegionChange(region) {
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

  async onMapPress(marker) {
    const { latitude, longitude } = marker.coordinate;
    const address = await this.getAddress(`${latitude}, ${longitude}`);
    // if (this.state.markers.length >= 1) {
    //   this.setPolylines(this.state.markers.concat(marker));
    // }
    this.setState({ selector: Object.assign(marker, { description: address } ) });
  }

  onMarkerPress(marker) {
    const { latitude, longitude } = marker.coordinate;
    this.setState({ polylines: [] });
    const markers = this.state.markers.filter(mark => !(mark.coordinate.latitude === latitude && mark.coordinate.longitude === longitude));
    if (markers.length > 1) {
      this.setPolylines(markers);
    }
    this.setState({ markers });
  }

  handleKeyPress(event) {
    if (event.key === 'Enter') {

    }
  }

  async autocompletePress(data, details) {
    const { lat, lng } = details.geometry.location;
    const description = await this.getAddress(`${lat}, ${lng}`);
    // const { markers } = this.state;
    // markers[0] = { coordinate: { longitude: lng, latitude: lat }, description };
    // if (markers.length > 1) {
    //   this.setPolylines(markers);
    // }

    this.map.animateToRegion({
        latitudeDelta: 0.004622,
        longitudeDelta: 0.00681,
        latitude: lat,
        longitude: lng,
      }, 500);
    this.setState({
      selector:
        { coordinate:
          { longitude: lng, latitude: lat },
          description
        },
    });
    return data;
  }

  onTextPress(i) {
    const marker = this.state.markers[i];
  }

  addMarker = (marker) => {
    const { markers } = this.state;
    const index = markers.indexOf(null);
    if (index === -1) return;
    const newMarkers = markers.map((prev, i) => i === index ? marker : prev);
      this.setState({ markers: newMarkers, selector: {}, });
      if (index > 0) {
        this.setPolylines(newMarkers.slice(0, index + 1));
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
    const pol = newMarkers.filter(marker => marker !== null);
    if (pol.length > 1) {
      this.setPolylines(pol);
    }
  }

  onRemoveTextPress = (index) => {
    const { markers, lastField } = this.state;
    const newMarkers = markers.filter((marker, i) => i !== index).concat(null);
    this.setState({ markers: newMarkers, polylines: [], lastField: lastField === 1 ? lastField : lastField - 1 });
    const polyline = newMarkers.filter(marker => marker !== null);
    if (polyline.length < 2) {
      this.setState({ distance: 0, cost: 30 });
    }
    return polyline.length > 1 ? this.setPolylines(polyline) : null;
  }

  openAutocomplete = (i, marker = null) => {
    this.setState({ selectedInput: { index: i, marker }});
  }

  addNextField = () => {
    const { lastField } = this.state;
    this.setState({ lastField: this.state.lastField + 1 });
  }

  goToUserLocation = () => {
    this.setState({ region:
      Object.assign({}, this.state.userCoordinates, {
        latitudeDelta: 0.004622,
        longitudeDelta: 0.00681
      })
    });
  }

  triggerMenu() {
    if (!this.state.showMenu) {
      Animated.timing(
        this.state.xPosition,
        {
          toValue: 250,
          duration: 1000,
        }
      ).start();
    } else {
      Animated.timing(
        this.state.xPosition,
        {
          toValue: 0,
          duration: 1000,
        }
      ).start();
    }
    this.setState({ showMenu: !this.state.showMenu });
  }

  async onAucompletePressIndex(data, details) {
    const { lat, lng } = details.geometry.location;
    const { index } = this.state.selectedInput;
    const description = await this.getAddress(`${lat}, ${lng}`);
    this.map.animateToRegion({
        latitudeDelta: 0.004622,
        longitudeDelta: 0.00681,
        latitude: lat,
        longitude: lng,
      }, 500);
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

  blurAutocomplete() {
    this.setState({ selectedInput: null });
  }

  toggleAuthForm = () => {
    this.setState({ showAuthForm: !this.state.showAuthForm });
  }

  logout = () => {
    this.setState({ user: null });
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
    const markers = this.state.markers.filter(marker => marker !== null).map(marker => ({ coordinate: marker.coordinate, description: marker.description }));
    if (markers.length < 2 || !this.state.user) return;
    const { cost } = this.state;
    const res = await this.props.createOrder({
      variables: { path: markers, customerId: this.state.user.id, cost }
    });
    if (res.data.OrderCreate) {
      this.setState({ order: res.data.OrderCreate });
      const { email, name, phoneNumber, id, orders } = this.state.user;
      const resUser = await this.props.updateUser({
        variables: { email, name, phoneNumber, id, orders: orders.concat(res.data.OrderCreate.id) }
      });
      if (resUser.data.UpdateUser) {
        this.updateUser(resUser.data.UpdateUser);
      }
    }
  }

  toggleOrderView = () => {
    if (!this.state.orderView) {
      Animated.timing(
        this.state.fadeAnim,
        {
          toValue: 1,
          duration: 500,
        }
      ).start();
      this.setState({ orderView: !this.state.orderView })
    } else {
      Animated.timing(
        this.state.fadeAnim,
        {
          toValue: 0,
          duration: 500,
        }
      ).start();
      setTimeout(() => this.setState({ orderView: !this.state.orderView }), 500);
    }
  }

  hasActiveOrder = (order) => {
    const { path } = order;
    this.setState({ order: order, markers: path });
    this.setPolylines(path);
  }

  changeCost = (cost) => {
    this.setState({ cost });
  }

  render() {
    const { latitude, longitude } = this.state.region;
    const { userCoordinates, markers } = this.state;
    const markersLength = markers.filter(marker => marker !== null).length;
    return (
      <View style={styles.container}>
        <Animated.View style={[{ width: 250, right: this.state.xPosition - width, top: 0, bottom: 0, backgroundColor: '#2f2f30', position: 'absolute', }]}>
          <View style={{ height: 75, backgroundColor: '#1492db', }}>
            { this.state.user ?
              <Text
                style={{ position: 'absolute', right: 10, bottom: 10 }}
                onPress={this.logout}>
                <Icon name="sign-out" size={30} color="#fff" style={{ width: 30 }} />
              </Text> :
              <Text style={{ position: 'absolute', top: 30, left: 30 }} onPress={this.toggleAuthForm}>Sign in</Text>
            }
            { this.state.user ?
              <Text
                style={{ position: 'absolute', bottom: 10, left: 10, }}
                onPress={this.toggleProfile}>
                <Icon name="user-circle" size={40} color="#fff" style={{ width: 40 }} />
                  <Text style={{ color: '#fff', marginLeft: 30 }}>{ this.state.user.phoneNumber }</Text>
              </Text> : null
            }
          </View>
          <TouchableOpacity style={styles.menuRow}>
            <Icon name="bookmark" size={25} color="#1492db" style={styles.menuIcon} />
            <Text style={styles.menuText}>My trips</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuRow}>
            <Icon name="star-o" size={25} color="#1492db" style={styles.menuIcon} />
            <Text style={styles.menuText}>My addresses</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL('mailto:react.native.taxi@gmail.com?subject=Support&body=body')} style={styles.menuRow}>
            <Icon name="support" size={25} color="#1492db" style={styles.menuIcon} />
            <Text style={styles.menuText}>Service Support</Text>
          </TouchableOpacity>
        </Animated.View>
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
            {Object.keys(this.state.selector).length > 0 &&
              <MapView.Marker
                coordinate={this.state.selector.coordinate}
                onPress={e => e.stopPropagation()}
                onCalloutPress={e => {e.stopPropagation();}}
                showCallout={true}
              >
                <MapView.Callout {...this.state.selector}>
                  <View style={{ position: 'relative', }}>
                    <Text style={{ marginRight: 30, }}>{`${this.state.selector.description.split(', ')[0]}, ${this.state.selector.description.split(', ')[1]}`}</Text>
                    {this.state.markers.indexOf(null) === -1 ? null :
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
                    onCalloutPress={e => {e.stopPropagation(); this.onMarkerPress(marker)}}
                  />
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
            <Text onPress={this.triggerMenu} style={{ position: 'absolute', left: 28, top: 34, color: '#000', }}>
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
          <TouchableOpacity
          onPress={this.goToUserLocation}
          style={{
            position: 'absolute',
            right: 5,
            borderRadius: 50,
            backgroundColor: '#fff',
            height: 50,
            width: 50,
            bottom: 200 + (this.state.lastField - 1) * 56 + (markersLength <= 2 ? 0 : markersLength - 2) * 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Icon name="location-arrow" size={35} color="#1492db" style={{ width: 35 }} />
          </TouchableOpacity>
          <View style={{
            position: 'absolute',
            right: 25,
            width: 100,
            height: 40,
            bottom: 135 + (this.state.lastField - 1) * 56 + (markersLength <= 2 ? 0 : markersLength - 2) * 56,
            justifyContent: 'center',
            backgroundColor: 'rgba(130, 130, 130, 0.5)',
            borderRadius: 100,
          }}>
            <Text style={{ fontSize: 18, marginLeft: 15 }}>{`${this.state.cost}uah`}</Text>
          </View>
          <TouchableOpacity
          onPress={this.toggleOrderView}
          style={{
            position: 'absolute',
            right: 5,
            borderRadius: 50,
            backgroundColor: '#f5cc12',
            height: 50,
            width: 50,
            bottom: 130 + (this.state.lastField - 1) * 56 + (markersLength <= 2 ? 0 : markersLength - 2) * 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Icon name="long-arrow-right" size={27} color="#000" style={{ width: 27 }} />
          </TouchableOpacity>
          <Order
            openAutocomplete={this.openAutocomplete}
            onRemoveTextPress={this.onRemoveTextPress}
            addNextField={this.addNextField}
            user={this.state.user}
            userId={this.state.user !== null && this.state.user.id}
            markers={this.state.markers}
            lastField={this.state.lastField}
            hasActiveOrder={this.hasActiveOrder}
            orderView={this.state.orderView}
            toggleOrderView={this.toggleOrderView}
            orderTaxi={this.orderTaxi}
            cost={this.state.cost}
            changeCost={this.changeCost}
          />
        </Animated.View>
        { this.state.orderView && <Animated.View style={[styles.header, { opacity: this.state.fadeAnim }]}>
            <Text style={{ marginTop: 30, marginLeft: 20, width: 40 }} onPress={() => this.toggleOrderView()}><Icon name="angle-down" size={35} color="#fff" style={{ width: 35 }} /></Text>
          </Animated.View>}
          {
            this.state.selectedInput ?
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
                if (!marker) {
                  return '';
                } else {
                  const value = marker.description;
                  return value;
                }
              }}
              debounce={200}
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
        { this.state.order !== null && <ActiveOrder socket={this.socket} cancelOrder={this.cancelOrder} order={this.state.order} /> }
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

Container.propTypes = {
}

const ContainerComponent = compose(
  graphql(createOrder, { name: 'createOrder' }),
  graphql(updateUser, { name: 'updateUser' })
)(Container);

export default ContainerComponent;
