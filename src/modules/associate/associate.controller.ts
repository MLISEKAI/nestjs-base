import { Controller, Logger } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@Controller('users')
@ApiTags('Users Associate')
@ApiBearerAuth('access-token')
export class ResAssociateController {
  constructor() {}
  logger = new Logger(ResAssociateController.name);
}
