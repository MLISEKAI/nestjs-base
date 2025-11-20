import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { EventService } from '../service/event.service';
import { CreateEventDto, UpdateEventDto, JoinEventDto } from '../dto/event.dto';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

@ApiTags('Events')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách public events' })
  @ApiOkResponse({ description: 'Danh sách events với pagination' })
  getEvents(@Query() query?: BaseQueryDto) {
    return this.eventService.getEvents(query);
  }

  @Get(':event_id')
  @ApiOperation({ summary: 'Lấy thông tin event' })
  @ApiOkResponse({ description: 'Thông tin event' })
  getEvent(@Param('event_id') eventId: string, @Query('user_id') userId?: string) {
    return this.eventService.getEvent(eventId, userId);
  }

  @Get('user/:user_id')
  @ApiOperation({ summary: 'Lấy danh sách events của user' })
  @ApiOkResponse({ description: 'Danh sách events user tham gia' })
  getUserEvents(@Param('user_id') userId: string, @Query() query?: BaseQueryDto) {
    return this.eventService.getUserEvents(userId, query);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo event mới' })
  @ApiBody({ type: CreateEventDto })
  @ApiCreatedResponse({ description: 'Event đã được tạo' })
  createEvent(@Param('user_id') userId: string, @Body() dto: CreateEventDto) {
    return this.eventService.createEvent(userId, dto);
  }

  @Patch(':event_id')
  @ApiOperation({ summary: 'Cập nhật event' })
  @ApiBody({ type: UpdateEventDto })
  @ApiOkResponse({ description: 'Event đã được cập nhật' })
  updateEvent(
    @Param('user_id') userId: string,
    @Param('event_id') eventId: string,
    @Body() dto: UpdateEventDto,
  ) {
    return this.eventService.updateEvent(userId, eventId, dto);
  }

  @Delete(':event_id')
  @ApiOperation({ summary: 'Xóa event' })
  @ApiOkResponse({ description: 'Event đã được xóa' })
  deleteEvent(@Param('user_id') userId: string, @Param('event_id') eventId: string) {
    return this.eventService.deleteEvent(userId, eventId);
  }

  @Post(':event_id/join')
  @ApiOperation({ summary: 'Tham gia event' })
  @ApiBody({ type: JoinEventDto })
  @ApiOkResponse({ description: 'Đã tham gia event' })
  joinEvent(
    @Param('user_id') userId: string,
    @Param('event_id') eventId: string,
    @Body() dto: JoinEventDto,
  ) {
    return this.eventService.joinEvent(userId, eventId, dto);
  }

  @Delete(':event_id/leave')
  @ApiOperation({ summary: 'Rời event' })
  @ApiOkResponse({ description: 'Đã rời event' })
  leaveEvent(@Param('user_id') userId: string, @Param('event_id') eventId: string) {
    return this.eventService.leaveEvent(userId, eventId);
  }

  @Get(':event_id/participants')
  @ApiOperation({ summary: 'Lấy danh sách participants của event' })
  @ApiOkResponse({ description: 'Danh sách participants với pagination' })
  getEventParticipants(@Param('event_id') eventId: string, @Query() query?: BaseQueryDto) {
    return this.eventService.getEventParticipants(eventId, query);
  }
}
