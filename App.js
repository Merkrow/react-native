import React from 'react';
import { ApolloProvider, createNetworkInterface, ApolloClient } from 'react-apollo'

import Container from './components/container';
import config from './config/config';

const networkInterface = createNetworkInterface({
  uri: `${config.api_url}/graphql`,
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
