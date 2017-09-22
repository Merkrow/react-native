import React from 'react';
import { StyleSheet, Text, View, TextInput, Button, ScrollView, StatusBar, TouchableOpacity, Animated, } from 'react-native';
import MapView from 'react-native-maps';
import Polyline from '@mapbox/polyline';
import { graphql, gql } from 'react-apollo'
import PropTypes from 'prop-types';

const authUser = gql`
  mutation AuthUser($phoneNumber: String!, $email: String!) {
    UserAuthRequest(data: { phoneNumber: $phoneNumber, email: $email })
  }`

import { GooglePlacesAutocomplete } from './autocomplete';

const API_KEY = 'AIzaSyB01muOUPXMrSoNJYQVS3aXaNgKQF-b9zA';
const mode = 'driving';

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
      userForm: {
        email: '',
        phoneNumber: '',
        code: '',
      },
      waitPassword: false,
    }
    this.onRegionChange = this.onRegionChange.bind(this);
    this.onMapPress = this.onMapPress.bind(this);
    this.onMarkerPress = this.onMarkerPress.bind(this);
    this.autocompletePress = this.autocompletePress.bind(this);
    this.openAutocomplete = this.openAutocomplete.bind(this);
    this.onAucompletePressIndex = this.onAucompletePressIndex.bind(this);
    this.blurAutocomplete = this.blurAutocomplete.bind(this);
    this.triggerMenu = this.triggerMenu.bind(this);
  }

  async getDirections(startLoc, destinationLoc) {
    try {
      let resp = await fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${ startLoc }&destination=${ destinationLoc }&key=${API_KEY}&mode=${mode}`)
      let respJson = await resp.json();
      let points = Polyline.decode(respJson.routes[0].overview_polyline.points);
      let coords = points.map((point, index) => {
        return  {
          latitude : point[0],
          longitude : point[1],
        }
      })
      this.setState({ polylines: this.state.polylines.concat({ coords: coords }) });
      return coords;
    } catch(error) {
      return error;
    }
  }

  async getAddress(coordinate) {
    try {
      let resp = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinate}&key=${API_KEY}&language=ru&components=route`)
      let respJson = await resp.json();
      const address = respJson.results[0].formatted_address.split(', ');
      return {
        country: address[address.length - 1],
        city: address[address.length - 3],
        streetNumber: address[address.length - 4],
        street: address[address.length - 5],
      };
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

  componentDidMount() {
    window.setInterval(this.setCurrentPos.bind(this), 10000);
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
    this.setState({ region, selector: {} });
  }

  setPolylines(arr) {
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
    this.setState({
      selector:
        { coordinate:
          { longitude: lng, latitude: lat },
          description
        },
      region: {
        latitudeDelta: 0.004622,
        longitudeDelta: 0.00681,
        latitude: lat,
        longitude: lng,
      }
    });
    return data;
  }

  onTextPress(i) {
    const marker = this.state.markers[i];
  }

  addMarker(marker) {
    const { markers } = this.state;
    const index = markers.indexOf(null);
    if (index === -1) return;
    markers[index] = marker;
      this.setState({ markers, selector: {}, });
      if (index > 0) {
        this.setPolylines(markers.slice(0, index + 1));
      }
  }

  addMarkerByIndex(marker, index) {
    const { markers } = this.state;
    markers[index] = marker;
    this.setState({ markers });
    const pol = markers.filter(marker => marker !== null);
    if (pol.length > 1) {
      this.setPolylines(pol);
    }
  }

  onRemoveTextPress(index) {
    const { markers, lastField } = this.state;
    const newMarkers = markers.filter((marker, i) => i !== index).concat(null);
    this.setState({ markers: newMarkers, polylines: [], lastField: lastField === 1 ? lastField : lastField - 1 });
    const polyline = newMarkers.filter(marker => marker !== null);
    return polyline.length > 1 ? this.setPolylines(polyline) : null;
  }

  openAutocomplete(i, marker = null) {
    this.setState({ selectedInput: { index: i, marker }});
  }

  addNextField() {
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
          duration: 2000,
        }
      ).start();
    } else {
      Animated.timing(
        this.state.xPosition,
        {
          toValue: 0,
          duration: 2000,
        }
      ).start();
    }
    this.setState({ showMenu: !this.state.showMenu });
  }

  renderMarkerInfoRow(marker, i) {
    if (marker === null && i > this.state.lastField) return;
    if (marker === null) {
      return (
        <View key={i} style={styles.markersListItem}>
          <Text style={styles.markersListText} onPress={() => this.openAutocomplete(i)}>{i === 0 ? 'From' : 'To'}</Text>
        </View>
      )
    }
    const { street, streetNumber } = marker.description;
    return (
      <View key={i} style={styles.markersListItem}>
        <Text style={styles.markersListText} onPress={() => this.openAutocomplete(i, marker)}>{`${street}, ${streetNumber}`}</Text>
        {this.state.markers[i + 1] !== null || i === 0 || this.state.lastField > i ?
          <Text
          onPress={() => this.onRemoveTextPress(i)}
          style={{
            textAlign: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0)',
            fontSize: 25,
            color: '#1492db',
            position: 'absolute',
            right: 10,
            top: 10,
          }}>—</Text> :
          <Text
          onPress={() => this.addNextField()}
          style={{
            textAlign: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0)',
            fontSize: 25,
            color: '#1492db',
            position: 'absolute',
            right: 10,
            top: 10,
          }}>+</Text>
        }
      </View>
    )
  }

  async onAucompletePressIndex(data, details) {
    const { lat, lng } = details.geometry.location;
    const { index } = this.state.selectedInput;
    const description = await this.getAddress(`${lat}, ${lng}`);
    this.addMarkerByIndex({ coordinate: { longitude: lng, latitude: lat }, description }, index)
    this.setState({
      selector:
        { coordinate:
          { longitude: lng, latitude: lat },
          description
        },
      region: {
        latitudeDelta: 0.004622,
        longitudeDelta: 0.00681,
        latitude: lat,
        longitude: lng,
      },
      selectedInput: null,
    });
    return data;
  }

  blurAutocomplete() {
    this.setState({ selectedInput: null });
  }

  registerUser = async () => {
    const { phoneNumber, email } = this.state.userForm;
    const res = await this.props.authUser({
      variables: { phoneNumber, email }
    })
    if (res.data.UserAuthRequest) {
      this.setState({ waitPassword: true });
    }
  }

  sendCode = async () => {
    console.log(this.state.userForm.code);
  }

  render() {
    const { latitude, longitude } = this.state.region;
    const { userCoordinates, markers } = this.state;
    const markersLength = markers.filter(marker => marker !== null).length;
    return (
      <View style={styles.container}>
        <Animated.View style={[{left: 0, width: this.state.xPosition, top: 0, bottom: 0, backgroundColor: '#2f2f30', position: 'absolute', }]}>
          <View style={{ height: 75, backgroundColor: '#1492db', }}>
          </View>
          <View style={styles.menuRow}>
            <Text style={styles.menuText}>My trips</Text>
          </View>
          <View style={styles.menuRow}>
            <Text style={styles.menuText}>My addresses</Text>
          </View>
          <View style={styles.menuRow}>
            <Text style={styles.menuText}>Service Support</Text>
          </View>
        </Animated.View>
        <Animated.View style={[styles.mapView, { left: this.state.xPosition, top: 0, right: 0, bottom: 0, }]}>
          <MapView
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
                    <Text style={{ marginRight: 30, }}>{this.state.selector.description.street + ', ' + this.state.selector.description.streetNumber}</Text>
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
                    description={marker.description.street + ', ' + marker.description.streetNumber}
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
                  const { city, country, street, streetNumber } = marker.description;
                  const value = `${street}, ${streetNumber}, ${city}, ${country}`;
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
            onPress={this.autocompletePress}
          />
          <Text onPress={this.triggerMenu} style={{ position: 'absolute', left: 30, top: 40, color: '#000' }}>Menu</Text>
          <TouchableOpacity
          onPress={this.goToUserLocation}
          style={{
            position: 'absolute',
            right: 5,
            borderRadius: 50,
            backgroundColor: '#fff',
            height: 50,
            width: 50,
            bottom: 130 + (markersLength <= 2 ? 0 : markersLength - 2) * 56,
          }}>
          </TouchableOpacity>
          <ScrollView style={styles.markersList}>
            {this.state.markers.map(this.renderMarkerInfoRow.bind(this))}
          </ScrollView>
        </Animated.View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center',backgroundColor: '#fff'}}>
          <View>
            <TextInput
              placeholder="phone number"
              style={{ borderWidth: 2, borderColor: '#1492db', marginTop: 10, padding: 5 }}
              onChangeText={(phoneNumber) => this.setState({ userForm: { ...this.state.userForm, phoneNumber }})}
            />
            <TextInput
              placeholder="email"
              style={{ borderWidth: 2, borderColor: '#1492db', marginTop: 10, padding: 5 }}
              onChangeText={(email) => this.setState({ userForm: { ...this.state.userForm, email }})}
            />
            <Button
              title="Submit"
              onPress={this.registerUser}
            />
            <TextInput
              placeholder="code"
              style={{ borderWidth: 2, borderColor: '#1492db', marginTop: 10, padding: 5 }}
              onChangeText={(code) => this.setState({ userForm: { ...this.state.userForm, code }})}
              editable={this.state.waitPassword}
            />
            <Button
              title="Submit Code"
              onPress={this.sendCode}
            />
          </View>
        </View>
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
  menuRow: {

  },
  menuText: {
    color: '#fff',
  },
  map: {
    left: 0,
    right: 0,
    top: 75,
    position: 'absolute',
  },
  markersList: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: '#dad9de',
  },
  markersListItem: {
    position: 'relative',
  },
  markersListText: {
    height: 56,
    lineHeight: 55,
    fontSize: 15,
    color: '#bababa',
    paddingLeft: 15,
  },
});

Container.propTypes = {
}

const ContainerWithData = graphql(authUser, {name: 'authUser'})(Container);

export default ContainerWithData;
