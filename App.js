import React from 'react';
import { StyleSheet, Text, View, TextInput, Button, ScrollView, } from 'react-native';
import MapView from 'react-native-maps';
import Polyline from '@mapbox/polyline';
import { GooglePlacesAutocomplete } from './autocomplete';

const API_KEY = 'AIzaSyB01muOUPXMrSoNJYQVS3aXaNgKQF-b9zA';
const mode = 'driving';

export default class App extends React.Component {
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
    }
    this.onRegionChange = this.onRegionChange.bind(this);
    this.onMapPress = this.onMapPress.bind(this);
    this.onMarkerPress = this.onMarkerPress.bind(this);
    this.autocompletePress = this.autocompletePress.bind(this);
    this.openAutocomplete = this.openAutocomplete.bind(this);
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
      this.setState({ markers: markers });
      if (index > 0) {
        this.setPolylines(markers.slice(0, index + 1));
      }
  }

  onRemoveTextPress(index) {
    const { markers } = this.state;
    const newMarkers = markers.filter((marker, i) => i !== index).concat(null);
    this.setState({ markers: newMarkers, polylines: [] });
    const polyline = newMarkers.filter(marker => marker !== null);
    console.log(polyline);
    return polyline.length > 1 ? this.setPolylines(polyline) : null;
  }

  openAutocomplete(i) {
  }

  renderMarkerInfoRow(marker, i) {
    if (marker === null && i > 1) return;
    if (marker === null) {
      return (
        <View key={i} style={styles.markersListItem}>
          <Text style={styles.markersListText} onPress={() => this.openAutocomplete(i)}>{i === 0 ? 'Enter Start' : 'Enter Desctination'}</Text>
        </View>
      )
    }
    const { street, streetNumber } = marker.description;
    return (
      <View key={i} style={styles.markersListItem}>
        <Text style={styles.markersListText} onPress={() => this.openAutocomplete(i, marker)}>{`${street}, ${streetNumber}`}</Text>
        <Button
          onPress={() => this.onRemoveTextPress(i)}
          title='Remove'
          color='#39f980'
          style={{
            width: 10,
            height: 10,
            borderColor: '#39f980',
            borderWidth: 2,
            borderStyle: 'solid',
            backgroundColor: '#fff',
          }}
        />
      </View>
    )
  }

  render() {
    const { latitude, longitude } = this.state.region;
    const { userCoordinates } = this.state;
    return (
      <View style={styles.container}>
        <MapView
          style={styles.map}
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
                <View>
                  <Text>{this.state.selector.description.street + ', ' + this.state.selector.description.streetNumber}</Text>
                  {this.state.markers.indexOf(null) === -1 ? null :
                    <Button
                      onPress={() => this.addMarker(this.state.selector)}
                      title='Add'
                      color='#39f980'
                      style={{
                        width: 10,
                        height: 10,
                        borderColor: '#39f980',
                        borderWidth: 2,
                        borderStyle: 'solid',
                        backgroundColor: '#fff',
                      }}
                    />
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
                <View style={{
                  height: 20,
                  width: 20,
                  backgroundColor: '#428ff4',
                  borderRadius: 50,
                  borderWidth: 3,
                  borderColor: '#fff',
                  borderStyle: 'solid',
                }} />
              </MapView.Marker>
            </View>
          }
        </MapView>
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
            },
            textInputContainer: {
              backgroundColor: 'rgba(0,0,0,0)',
              borderTopWidth: 0,
              borderBottomWidth:0
            },
            textInput: {
              marginLeft: 30,
              marginRight: 30,
              height: 38,
              color: '#5d5d5d',
              fontSize: 16
            },
          }}
          onPress={this.autocompletePress}
        />
        <ScrollView style={styles.markersList}>
          {this.state.markers.map(this.renderMarkerInfoRow.bind(this))}
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  map: {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    position: 'absolute',
  },
  markersList: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  markersListItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderStyle: 'solid',
  },
  markersListText: {
    height: 40,
    lineHeight: 40,
    fontSize: 18,
  },
});
