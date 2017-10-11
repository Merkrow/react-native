import { gql } from 'react-apollo';

export default gql`
  mutation Login($phoneNumber: String!, $code: Int!) {
    LoginWithPw(data: { phoneNumber: $phoneNumber, pw: $code }) {
      id
      phoneNumber
      email
      favoritePlaces
      orders
      name
    }
  }
`
