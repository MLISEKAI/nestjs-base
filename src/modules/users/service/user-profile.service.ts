import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { UpdateUserDto } from '../dto/user-response'

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

  async searchUsers(params: { search?: string; page?: number; limit?: number; sort?: string }) {
    const search = params?.search
    const where = search
      ? {
          OR: [
            { nickname: { contains: search, mode: 'insensitive' as const } },
            { id: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    let orderBy: Record<string, 'asc' | 'desc'> = { created_at: 'asc' }
    if (params?.sort) {
      const [field, dir] = String(params.sort).split(':')
      if (field) orderBy = { [field]: (dir?.toLowerCase() === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc' }
    }

    const take = params?.limit && params.limit > 0 ? params.limit : 20
    const page = params?.page && params.page > 0 ? params.page : 1
    const skip = (page - 1) * take

    const [users, total] = await Promise.all([
      this.prisma.resUser.findMany({ where, orderBy, take, skip }),
      this.prisma.resUser.count({ where }),
    ])

    return { message: 'Users fetched', users, page, limit: take, total }
  }

  async uploadAvatar(userId: string, fileUrl: string) {
    const user = await this.prisma.resUser.update({ where: { id: userId }, data: { avatar: fileUrl } })
    return { message: 'Avatar updated', avatar: user.avatar }
  }
}