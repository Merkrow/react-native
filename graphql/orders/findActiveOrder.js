import { gql, } from 'react-apollo';

export default gql`
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
