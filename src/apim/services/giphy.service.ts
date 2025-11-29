import { BadRequestException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { AbstractService } from './abstract.service';
import { GiphyResponse } from '../interfaces/giphy.interface';

@Injectable()
export class GiphyApiService extends AbstractService {
  private logger = new Logger(GiphyApiService.name);

  constructor() {
    super();
  }

  protected async getConfig(): Promise<any> {}

  private GIPHY_API_KEY = process.env.GIPHY_API_KEY;

  protected async getBaseUrl(): Promise<string> {
    return process.env.GIPHY_API_URL || 'https://api.giphy.com/v1';
  }

  async fetchDataTrending(
    type: 'gifs' | 'stickers',
    options: {
      limit?: number;
      offset?: number;
      ranking?: string;
    },
  ): Promise<GiphyResponse> {
    const { limit = 20, offset = 0, ranking } = options;
    try {
      const response = await this.axiosService.get({
        _url: await this.makeUrl(`/${type}/trending`),
        _param: {
          api_key: this.GIPHY_API_KEY,
          limit: limit,
          offset: offset,
          ranking: ranking,
        },
      });

      if (!response) {
        throw new BadRequestException('No data received from Giphy API');
      }

      return response.body as GiphyResponse;
    } catch (error) {
      this.logger.error(`❌ Fn fetchApiAppAccessToken with Error: ${error?.message}`);
      throw error;
    }
  }

  async fetchDataBySearchText(
    type: 'gifs' | 'stickers',
    options: {
      limit?: number;
      offset?: number;
      ranking?: string;
      searchText: string;
    },
  ): Promise<GiphyResponse> {
    const { limit = 20, offset = 0, ranking, searchText = '' } = options;
    try {
      const response = await this.axiosService.get<any>({
        _url: await this.makeUrl(`/${type}/search`),
        _param: {
          api_key: this.GIPHY_API_KEY,
          q: searchText,
          limit,
          offset,
          ranking,
        },
      });

      if (!response) {
        throw new BadRequestException('No data received from Giphy API');
      }
      return response.body as GiphyResponse;
    } catch (error) {
      this.logger.error(`❌ Fn fetchDataBySearchText with Error: ${error?.message}`);
      throw error;
    }
  }
}
