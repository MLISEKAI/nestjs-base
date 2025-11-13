import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAlbumDto, UpdateAlbumDto } from '../dto/album.dto';

@Injectable()
export class AlbumService {
  constructor(private prisma: PrismaService) {}

  async getAlbums(userId: string) {
    return this.prisma.resAlbum.findMany({
      where: { user_id: userId },
      include: { photos: true },
    });
  }

  async createAlbum(userId: string, dto: CreateAlbumDto) {
    return this.prisma.resAlbum.create({ data: { user_id: userId, title: dto.title, image_url: dto.imageUrl } });
  }

  async updateAlbum(userId: string, albumId: string, dto: UpdateAlbumDto) {
    const existing = await this.prisma.resAlbum.findFirst({ where: { id: albumId, user_id: userId } });
    if (!existing) throw new NotFoundException('Album not found');
    return this.prisma.resAlbum.update({
      where: { id: albumId },
      data: { title: dto.title ?? existing.title, image_url: dto.imageUrl ?? existing.image_url },
    });
  }

  async getAlbumPhotos(userId: string, albumId: string) {
    const album = await this.prisma.resAlbum.findFirst({
      where: { id: albumId, user_id: userId },
      include: { photos: true },
    });
    if (!album) throw new NotFoundException('Album not found');
    return album.photos;
  }

  async addPhotoToAlbum(userId: string, albumId: string, imageUrl: string) {
    const album = await this.prisma.resAlbum.findFirst({ where: { id: albumId, user_id: userId } });
    if (!album) throw new NotFoundException('Album not found');
    const [photo, count] = await this.prisma.$transaction([
      this.prisma.resAlbumPhoto.create({ data: { album_id: albumId, image_url: imageUrl } }),
      this.prisma.resAlbumPhoto.count({ where: { album_id: albumId } }),
    ]);
    return { photo, albumPhotoCount: count };
  }

  async deletePhotoFromAlbum(userId: string, albumId: string, photoId: string) {
    const album = await this.prisma.resAlbum.findFirst({ where: { id: albumId, user_id: userId } });
    if (!album) throw new NotFoundException('Album not found');
    await this.prisma.resAlbumPhoto.delete({ where: { id: photoId } });
    return { message: 'Photo deleted' };
  }
}