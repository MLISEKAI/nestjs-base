import { BadRequestException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { AbstractService } from './abstract.service';
import { RedisCachingService } from 'src/redis/cache.service';

@Injectable()
export class BeAdminApiService extends AbstractService {
  private logger = new Logger(BeAdminApiService.name);

  constructor() {
    super();
  }

  protected async getConfig(): Promise<any> {}

  protected async getBaseUrl(): Promise<string> {
    return process.env.BE_URL_ADMIN || '';
  }

  async fetchInterestByUids(param: { includes?: string; searchText?: string }): Promise<any> {
    try {
      const response = await this.axiosService.get<any>({
        _url: await this.makeUrl(`/v1/interest/view`),
        _param: {
          includes: param?.includes,
          searchText: param?.searchText,
        },
      });
      if (response.statusCode !== HttpStatus.OK || response.body?.code !== HttpStatus.OK) {
        this.logger.error(`❌ API fetchInterestByUids with Error: ${response?.body?.message}`);
        return [];
      }
      return response?.body?.data;
    } catch (error) {
      this.logger.error(`❌ Fn fetchApiAppAccessToken with Error: ${error?.message}`);
      throw error;
    }
  }
}
