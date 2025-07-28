export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  updatedAt?: string;
  profile?: {
    avatar?: string;
    bio?: string;
  };
}

export interface UserResponse {
  code: number;
  message: string;
  data: User | User[] | any;
}