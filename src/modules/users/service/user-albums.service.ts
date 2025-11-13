import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'

@Injectable()
export class UserAlbumsService {
  constructor(private prisma: PrismaService) {}

  async getAlbums(userId: string) {
    const albums = await this.prisma.resAlbum.findMany({ where: { user_id: userId }, include: { photos: true } })
    return { message: 'Albums fetched', albums }
  }

  async getAlbumPhotos(userId: string, albumId: string) {
    const album = await this.prisma.resAlbum.findFirst({ where: { id: albumId, user_id: userId }, include: { photos: true } })
    if (!album) throw new NotFoundException('Album not found')
    return { message: 'Photos fetched', photos: album.photos }
  }

  async addPhotoToAlbum(userId: string, albumId: string, imageUrl: string) {
    const album = await this.prisma.resAlbum.findFirst({ where: { id: albumId, user_id: userId } })
    if (!album) throw new NotFoundException('Album not found')
    const photo = await this.prisma.resAlbumPhoto.create({ data: { album_id: albumId, image_url: imageUrl } })
    return { message: 'Photo added', photo }
  }

  async deletePhotoFromAlbum(userId: string, albumId: string, photoId: string) {
    const album = await this.prisma.resAlbum.findFirst({ where: { id: albumId, user_id: userId } })
    if (!album) throw new NotFoundException('Album not found')
    await this.prisma.resAlbumPhoto.delete({ where: { id: photoId } })
    return { message: 'Photo deleted' }
  }
}