import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { GoogleGeocodeAPIResponse } from '../interfaces/google-map.interface';
import { AbstractService } from './abstract.service';
import axios from 'axios';

@Injectable()
export class GoogleMapService extends AbstractService {
  private logger = new Logger(GoogleMapService.name);

  constructor() {
    super();
  }

  protected async getConfig(): Promise<any> {}

  private GOOGLE_MAP_API_KEY = process.env.GOOGLE_MAP_API_KEY;

  protected async getBaseUrl(): Promise<string> {
    return process.env.GOOGLE_MAP_API_URL || 'https://maps.googleapis.com/maps/api';
  }

  async getGeocodeByAddress(addressQuery: string): Promise<GoogleGeocodeAPIResponse> {
    try {
      // const response = await this.axiosService.get({
      //   _url: await this.makeUrl(`/geocode/json/`),
      //   _param: {
      //     address: addressQuery,
      //     key: this.GOOGLE_MAP_API_KEY,
      //   },
      // });

      const res = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
          address: addressQuery,
          key: this.GOOGLE_MAP_API_KEY,
        },
      });

      if (res.status !== 200) {
        throw new BadRequestException('No data received from Google Map API');
      }

      return res.data;
    } catch (error) {
      this.logger.error(`❌ Fn getGeocodeByAddress with Error: ${error?.message}`);
      throw error;
    }
  }

  async getNearBySearchWithLocation(
    location: string,
    options?: {
      pagetoken?: string;
      language?: string;
      radius?: number;
    },
  ): Promise<GoogleGeocodeAPIResponse> {
    try {
      const res = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
        params: {
          key: this.GOOGLE_MAP_API_KEY,
          location: location,
          ...options,
        },
      });

      if (res.status !== 200) {
        throw new BadRequestException('No data received from Google Map API');
      }
      return res.data as GoogleGeocodeAPIResponse;
    } catch (error) {
      this.logger.error(`❌ Fn getNearBySearchWithLocation with Error: ${error?.message}`);
      throw error;
    }
  }
}
