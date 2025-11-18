import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private bucket: any = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const defaultPath = './config/firebase-service-account.json';
    const configuredPath =
      this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_PATH') ?? defaultPath;
    const base64Credential = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_BASE64');
    const explicitProjectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const storageBucket = this.configService.get<string>('FIREBASE_STORAGE_BUCKET');

    let serviceAccount: admin.ServiceAccount | undefined;
    let resolvedProjectId = explicitProjectId;

    if (configuredPath) {
      const absolutePath = resolve(process.cwd(), configuredPath);
      if (existsSync(absolutePath)) {
        try {
          serviceAccount = JSON.parse(readFileSync(absolutePath, 'utf8'));
          const accountProjectId =
            serviceAccount.projectId ??
            (serviceAccount as typeof serviceAccount & { project_id?: string }).project_id;
          resolvedProjectId = accountProjectId ?? resolvedProjectId;
          this.logger.log(`Loaded Firebase service account from ${configuredPath}`);
        } catch (error) {
          this.logger.error(
            `Failed to parse Firebase service account at ${configuredPath}`,
            error as Error,
          );
        }
      } else if (configuredPath !== defaultPath) {
        this.logger.warn(
          `Firebase service account file not found at ${configuredPath}. Falling back to other options.`,
        );
      }
    }

    if (!serviceAccount && base64Credential) {
      try {
        serviceAccount = JSON.parse(Buffer.from(base64Credential, 'base64').toString('utf8'));
        const accountProjectId =
          serviceAccount.projectId ??
          (serviceAccount as typeof serviceAccount & { project_id?: string }).project_id;
        resolvedProjectId = accountProjectId ?? resolvedProjectId;
        this.logger.log('Loaded Firebase service account from FIREBASE_SERVICE_ACCOUNT_BASE64');
      } catch (error) {
        this.logger.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_BASE64', error as Error);
      }
    }

    if (!serviceAccount && !resolvedProjectId) {
      this.logger.warn(
        'Firebase is not fully configured. Provide FIREBASE_SERVICE_ACCOUNT_PATH (or BASE64) or FIREBASE_PROJECT_ID.',
      );
      return;
    }

    try {
      if (!admin.apps.length) {
        if (serviceAccount) {
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: storageBucket || `${resolvedProjectId}.appspot.com`,
          });
        } else {
          admin.initializeApp({
            projectId: resolvedProjectId,
            storageBucket: storageBucket || `${resolvedProjectId}.appspot.com`,
          });
        }
      }

      this.bucket = admin.storage().bucket(storageBucket || `${resolvedProjectId}.appspot.com`);
      this.logger.log('Firebase Admin SDK initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK', error as Error);
    }
  }

  async uploadFile(file: Express.Multer.File, path: string): Promise<string> {
    if (!this.bucket) {
      throw new Error('Firebase Storage is not configured');
    }

    const fileName = `${path}/${Date.now()}-${file.originalname}`;
    const fileUpload = this.bucket.file(fileName);

    const stream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });

    return new Promise((resolve, reject) => {
      stream.on('error', (error) => {
        this.logger.error('File upload error', error);
        reject(error);
      });

      stream.on('finish', async () => {
        await fileUpload.makePublic();
        const publicUrl = `https://storage.googleapis.com/${this.bucket.name}/${fileName}`;
        resolve(publicUrl);
      });

      stream.end(file.buffer);
    });
  }

  async deleteFile(path: string): Promise<void> {
    if (!this.bucket) {
      throw new Error('Firebase Storage is not configured');
    }

    try {
      await this.bucket.file(path).delete();
    } catch (error) {
      this.logger.error('File deletion error', error);
      throw error;
    }
  }

  isConfigured(): boolean {
    return this.bucket !== null;
  }
}
