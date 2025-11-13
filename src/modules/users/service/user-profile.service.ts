import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { UpdateUserDto } from '../dto/update-user.dto'

@Injectable()
export class UserProfileService {
  constructor(private prisma: PrismaService) {}

  async findUser(id: string) {
    return this.prisma.resUser.findUnique({
      where: { id },
      include: { albums: { include: { photos: true } } },
    })
  }

  async findOne(id: string) {
    const user = await this.findUser(id)
    if (!user) return { message: 'User not found' }
    return user
  }

  async updateProfile(id: string, dto: UpdateUserDto) {
    const existingUser = await this.prisma.resUser.findUnique({ where: { id } })
    if (!existingUser) throw new NotFoundException('User not found')

    const user = await this.prisma.resUser.update({
      where: { id },
      data: {
        nickname: dto.nickname,
        avatar: dto.avatar,
        bio: dto.bio,
        gender: dto.gender,
        birthday: dto.birthday ? new Date(dto.birthday) : undefined,
      },
      select: {
        id: true,
        nickname: true,
        bio: true,
        avatar: true,
        gender: true,
        birthday: true,
        updated_at: true,
      },
    })

    return { message: 'Profile updated successfully', user }
  }

  async searchUsers(search?: string) {
    const where = search
      ? {
          OR: [
            { nickname: { contains: search, mode: 'insensitive' as const } },
            { id: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}
    const users = await this.prisma.resUser.findMany({ where, orderBy: { created_at: 'asc' } })
    return { message: 'Users fetched', users }
  }

  async uploadAvatar(userId: string, fileUrl: string) {
    const user = await this.prisma.resUser.update({ where: { id: userId }, data: { avatar: fileUrl } })
    return { message: 'Avatar updated', avatar: user.avatar }
  }
}