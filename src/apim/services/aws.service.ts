import { Injectable, Logger } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import sharp from 'sharp';

@Injectable()
export class AwsService {
  private SpacesStorage: S3;
  logger = new Logger(AwsService.name);
  constructor() {
    this.SpacesStorage = new S3({
      accessKeyId: process.env.S3_AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_AWS_SECRET_ACCESS_KEY!,
      endpoint: process.env.S3_AWS_END_POINT!,
    });
  }

  upload(file: any, folderName = 'files', isPublic = true) {
    const acl = isPublic ? 'public-read' : 'private';
    const bucket = `${process.env.S3_BUCKET}/${process.env.NODE_ENV}/${folderName}`;
    return this.SpacesStorage.upload({
      Bucket: bucket,
      Key: Date.now() + file.originalname,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: acl,
    }).promise();
  }

  async uploadImageAndConvertWebp(data: Buffer, type: string = '', folderName = 'images', isPublic = true) {
    try {
      const acl = isPublic ? 'public-read' : 'private';
      const bucket = `${process.env.S3_BUCKET}/${process.env.NODE_ENV}/${folderName}`;
      let convertBuffer = data;
      if (!type) {
        convertBuffer = await sharp(data).webp().toBuffer();
      }
      return this.SpacesStorage.upload({
        Bucket: bucket,
        Key: `${Date.now()}`,
        Body: convertBuffer,
        ContentType: type || `image/webp`,
        ACL: acl,
      }).promise();
    } catch (error: any) {
      this.logger.error(`Error occurred while uploading image: ${error?.message}`);
      throw new Error(`Error occurred while uploading image: ${error?.message}`);
    }
  }
}
