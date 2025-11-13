import { ApiProperty } from "@nestjs/swagger"

export interface UserConnectionDto {
  id: string
  nickname: string
  avatar?: string
  is_following: boolean
  is_friend: boolean
}

export class UserConnectionDto {
  @ApiProperty({ example: 'user-id-123' })
  id: string

  @ApiProperty({ example: 'Nguyen Van A' })
  nickname: string

  @ApiProperty({ example: 'https://example.com/avatar.jpg', required: false })
  avatar?: string

  @ApiProperty({ example: true })
  is_following: boolean

  @ApiProperty({ example: false })
  is_friend: boolean
}