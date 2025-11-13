export interface IUser {
  id: string;
  username: string;
  bio?: string;
  birthday?: string;
  avatar?: string;
  gender?: string;
  is_following: boolean;
  created_at: Date;
}

interface UserConnectionDto {
  id: string
  nickname: string
  avatar?: string
  is_following: boolean
  is_friend: boolean
}
