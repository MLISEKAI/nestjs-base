// Import Injectable và exceptions từ NestJS
import { Injectable, NotFoundException } from '@nestjs/common';
// Import PrismaService để query database
import { PrismaService } from 'src/prisma/prisma.service';

/**
 * @Injectable() - Đánh dấu class này là NestJS service
 * UserAlbumsService - Service xử lý business logic cho albums (album ảnh của user)
 *
 * Chức năng chính:
 * - Lấy danh sách albums của user
 * - Lấy photos trong album
 * - Thêm photo vào album
 * - Xóa photo khỏi album
 *
 * Lưu ý:
 * - User chỉ có thể quản lý albums của chính mình
 * - Albums có thể chứa nhiều photos
 */
@Injectable()
export class UserAlbumsService {
  /**
   * Constructor - Dependency Injection
   * NestJS tự động inject PrismaService khi tạo instance của service
   */
  constructor(private prisma: PrismaService) {}

  async getAlbums(userId: string) {
    const albums = await this.prisma.resAlbum.findMany({
      where: { user_id: userId },
      include: { photos: true },
    });
    return { message: 'Albums fetched', albums };
  }

  async getAlbumPhotos(userId: string, albumId: string) {
    const album = await this.prisma.resAlbum.findFirst({
      where: { id: albumId, user_id: userId },
      include: { photos: true },
    });
    if (!album) throw new NotFoundException('Album not found');
    return { message: 'Photos fetched', photos: album.photos };
  }

  async addPhotoToAlbum(userId: string, albumId: string, imageUrl: string) {
    const album = await this.prisma.resAlbum.findFirst({ where: { id: albumId, user_id: userId } });
    if (!album) throw new NotFoundException('Album not found');
    const photo = await this.prisma.resAlbumPhoto.create({
      data: { album_id: albumId, image_url: imageUrl },
    });
    return { message: 'Photo added', photo };
  }

  async deletePhotoFromAlbum(userId: string, albumId: string, photoId: string) {
    const album = await this.prisma.resAlbum.findFirst({ where: { id: albumId, user_id: userId } });
    if (!album) throw new NotFoundException('Album not found');
    await this.prisma.resAlbumPhoto.delete({ where: { id: photoId } });
    return { message: 'Photo deleted' };
  }
}
