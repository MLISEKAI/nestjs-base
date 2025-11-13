import { Controller, Get, Post, Patch, Delete, Body, Param, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { FeedbackDto, FeedbackResponseDto } from '../dto/feedback.dto';
import { FeedbackService } from '../service/feedback.service';

@ApiTags('Feedback')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('profile/feedback')
export class FeedbackController {
  constructor(private readonly feedback: FeedbackService) {}

@Post()
@ApiOperation({ summary: 'Gửi phản hồi từ user' })
@ApiBody({ type: FeedbackDto })
@ApiCreatedResponse({
  description: 'Feedback tạo theo schema Prisma',
  type: FeedbackResponseDto,
})
postFeedback(@Body() dto: FeedbackDto) {
  return this.feedback.postFeedback(dto);
}

@Get(':user_id')
@ApiOperation({ summary: 'Lấy danh sách phản hồi của user' })
@ApiOkResponse({
  description: 'Danh sách feedback theo schema Prisma',
  type: FeedbackResponseDto,
  isArray: true,
})
getFeedback(@Param('user_id') userId: string) {
  return this.feedback.getFeedback(userId);
}

@Patch(':feedback_id')
@ApiOperation({ summary: 'Cập nhật phản hồi' })
@ApiBody({ type: FeedbackDto })
@ApiOkResponse({
  description: 'Phản hồi sau khi cập nhật thành công',
  type: FeedbackResponseDto,
})
updateFeedback(@Param('feedback_id') feedbackId: string, @Body() dto: FeedbackDto) {
  return this.feedback.updateFeedback(feedbackId, dto);
}

  @Delete(':feedback_id')
  @ApiOperation({ summary: 'Xóa phản hồi' })
  deleteFeedback(@Param('feedback_id') feedbackId: string) {
    return this.feedback.deleteFeedback(feedbackId);
  }
}