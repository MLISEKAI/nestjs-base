import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CacheService } from 'src/common/cache/cache.service';
import { CreateAlbumDto, UpdateAlbumDto } from '../dto/album.dto';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';
import { buildPaginatedResponse } from '../../../../common/utils/pagination.util';

@Injectable()
export class AlbumService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  async getAlbums(userId: string, query?: BaseQueryDto) {
    const take = query?.limit && query.limit > 0 ? query.limit : 20;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    const cacheKey = `user:${userId}:albums:page:${page}:limit:${take}`;
    const cacheTtl = 300; // 5 phút

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const [albums, total] = await Promise.all([
          this.prisma.resAlbum.findMany({
            where: { user_id: userId },
            include: { photos: true },
            take,
            skip,
            orderBy: { created_at: 'desc' },
          }),
          this.prisma.resAlbum.count({ where: { user_id: userId } }),
        ]);

        return buildPaginatedResponse(albums, total, page, take);
      },
      cacheTtl,
    );
  }

  async createAlbum(userId: string, dto: CreateAlbumDto) {
    const album = await this.prisma.resAlbum.create({
      data: { user_id: userId, title: dto.title, image_url: dto.image_url },
    });

    // Invalidate cache
    await this.cacheService.delPattern(`user:${userId}:albums:*`);

    return album;
  }

  async updateAlbum(userId: string, albumId: string, dto: UpdateAlbumDto) {
    // Tối ưu: Nếu có cả title và image_url, update trực tiếp
    if (dto.title && dto.image_url) {
      try {
        return await this.prisma.resAlbum.update({
          where: { id: albumId, user_id: userId },
          data: { title: dto.title, image_url: dto.image_url },
        });
      } catch (error) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Album not found');
        }
        throw error;
      }
    }

    // Nếu thiếu một trong hai, query để lấy giá trị hiện tại
    const existing = await this.prisma.resAlbum.findFirst({
      where: { id: albumId, user_id: userId },
      select: { title: true, image_url: true },
    });
    if (!existing) throw new NotFoundException('Album not found');
    const album = await this.prisma.resAlbum.update({
      where: { id: albumId },
      data: { title: dto.title ?? existing.title, image_url: dto.image_url ?? existing.image_url },
    });

    // Invalidate cache
    await this.cacheService.delPattern(`user:${userId}:albums:*`);
    await this.cacheService.del(`user:${userId}:album:${albumId}:photos`);

    return album;
  }

  async getAlbumPhotos(userId: string, albumId: string) {
    const cacheKey = `user:${userId}:album:${albumId}:photos`;
    const cacheTtl = 300; // 5 phút

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const album = await this.prisma.resAlbum.findFirst({
          where: { id: albumId, user_id: userId },
          include: { photos: true },
        });
        if (!album) throw new NotFoundException('Album not found');
        return album.photos;
      },
      cacheTtl,
    );
  }

  async addPhotoToAlbum(userId: string, albumId: string, imageUrl: string) {
    // Tối ưu: Verify album ownership bằng cách check trong transaction
    // Nếu album không tồn tại hoặc không thuộc user, transaction sẽ fail
    try {
      const [album, photo, count] = await this.prisma.$transaction([
        this.prisma.resAlbum.findFirstOrThrow({
          where: { id: albumId, user_id: userId },
          select: { id: true },
        }),
        this.prisma.resAlbumPhoto.create({ data: { album_id: albumId, image_url: imageUrl } }),
        this.prisma.resAlbumPhoto.count({ where: { album_id: albumId } }),
      ]);
      // Invalidate cache
      await this.cacheService.del(`user:${userId}:album:${albumId}:photos`);
      await this.cacheService.delPattern(`user:${userId}:albums:*`);

      return { photo, albumPhotoCount: count };
    } catch (error) {
      if (error.code === 'P2025' || error.code === 'P2003') {
        throw new NotFoundException('Album not found or access denied');
      }
      throw error;
    }
  }

  async deletePhotoFromAlbum(userId: string, albumId: string, photoId: string) {
    // Tối ưu: Verify album ownership trước khi delete photo
    try {
      const album = await this.prisma.resAlbum.findFirstOrThrow({
        where: { id: albumId, user_id: userId },
        select: { id: true },
      });
      await this.prisma.resAlbumPhoto.delete({ where: { id: photoId } });

      // Invalidate cache
      await this.cacheService.del(`user:${userId}:album:${albumId}:photos`);
      await this.cacheService.delPattern(`user:${userId}:albums:*`);

      return { message: 'Photo deleted' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Album not found or access denied');
      }
      throw error;
    }
  }
}
