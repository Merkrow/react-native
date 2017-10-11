import { gql } from 'react-apollo';

export default gql`
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
