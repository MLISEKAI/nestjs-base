import { Inject } from '@nestjs/common';
import { AxiosService } from './axios.service';

export abstract class AbstractService {
  @Inject(AxiosService)
  protected axiosService: AxiosService;

  protected abstract getBaseUrl(): Promise<string>;

  protected async makeUrl(path: string): Promise<string> {
    return (await this.getBaseUrl()) + path;
  }
}
