import { createContext } from 'react';

export const AuthContext = createContext({
  user: null,
  token: null,
  loading: false,
  login: async () => {},
  logout: () => {},
  refreshUser: async () => {},
});

export default AuthContext;
