import { HttpService } from '@nestjs/axios';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { omit } from 'lodash';
import { AxiosInterface, AxiosRes, Get, Method, Post } from '../interfaces/axios.interface';

@Injectable()
export class AxiosService implements AxiosInterface {
  private logger = new Logger(AxiosService.name);

  private omitKey = ['config', 'headers', 'request', 'statusText'];

  constructor(private httpService: HttpService) {}

  private async request<T = any>(method: Method, data: Post) {
    const { _body = {}, _param = {}, _headers = {}, _contentType, _url } = data;
    try {
      const { Authorization, ...publicHeader } = _headers;
      this.logger.log(`—— Method ${method}: ${JSON.stringify({ ...data, _url, _header: publicHeader })}`);
      const response: any = await this.httpService.axiosRef<any, T, any>({
        method,
        url: _url,
        data: _body,
        params: _param,
        headers: {
          'Accept-Encoding': 'gzip,deflate,compress',
          'Content-Type': _contentType || 'application/json',
          ..._headers,
        },
      });
      this.logger.log(`—— Response: ${JSON.stringify(omit(response, ...this.omitKey))}`);
      return {
        statusCode: HttpStatus.OK,
        body: response?.data,
        headers: response.headers,
      };
    } catch (error: any) {
      this.logger.error(`—— Error ${JSON.stringify(error?.response?.data)}`);
      return {
        statusCode: error?.status | error?.response?.status,
        body: error?.response?.data || {},
      };
    }
  }

  async post<T = any>(data: Post): Promise<AxiosRes<T>> {
    return this.request<T>('POST', data);
  }

  async put<T = any>(data: Post): Promise<AxiosRes<T>> {
    return this.request<T>('PUT', data);
  }

  async patch<T = any>(data: Post): Promise<AxiosRes<T>> {
    return this.request<T>('PATCH', data);
  }

  async delete<T = any>(data: Post): Promise<AxiosRes<T>> {
    return this.request<T>('DELETE', data);
  }

  async get<T = any>(data: Get): Promise<AxiosRes<T>> {
    return this.request<T>('GET', data);
  }
}
