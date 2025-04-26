export interface CreateAccountInput {
  username: string;
  email: string;
  password: string;
}

export interface LoginInput {
  usernameOrEmail: string;
  password: string;
}
