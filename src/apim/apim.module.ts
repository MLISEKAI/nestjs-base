import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { AxiosService } from './services/axios.service';
import { AwsService } from './services/aws.service';
import { BeAdminApiService } from './services/be-admin.service';
import { GiphyApiService } from './services/giphy.service';
import { GoogleMapService } from './services/google-maps.service';

@Global()
@Module({
  imports: [HttpModule],
  providers: [AxiosService, AwsService, BeAdminApiService, GiphyApiService, GoogleMapService],
  exports: [AxiosService, AwsService, BeAdminApiService, GiphyApiService, GoogleMapService],
})
export class ApiModule {}
