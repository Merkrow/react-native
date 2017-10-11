import { gql } from 'react-apollo';

export default gql`
  mutation AuthUser($phoneNumber: String!, $email: String!) {
    UserAuthRequest(data: { phoneNumber: $phoneNumber, email: $email })
  }
`
