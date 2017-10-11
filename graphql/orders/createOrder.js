import { gql } from 'react-apollo';

export default gql`
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
`;
