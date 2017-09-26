import React from 'react';
import { ApolloProvider, createNetworkInterface, ApolloClient } from 'react-apollo'

import Container from './components/container';

const networkInterface = createNetworkInterface({
  uri: 'http://192.168.164.123:3000/graphql',
});
const client = new ApolloClient({
  networkInterface
});

export default class App extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <ApolloProvider client={client}>
        <Container />
      </ApolloProvider>
    )
  }
}
