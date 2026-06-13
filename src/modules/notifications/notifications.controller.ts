import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Paginated } from '../../common/http/paginated';
import { ApiData, ApiPaginatedData } from '../../common/http/swagger';
import { NotificationParamDto } from './dto/notification-param.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiCookieAuth('access_token')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiPaginatedData(NotificationResponseDto, {
    description: 'Lists notifications visible to the current user',
    errors: [400, 401, 429],
  })
  async list(
    @Query() query: NotificationQueryDto,
    @CurrentUser() actor: Express.User,
  ): Promise<Paginated<NotificationResponseDto>> {
    const notifications = await this.notificationsService.list(query, actor);
    return new Paginated(
      notifications.items.map((notification) => this.toResponse(notification)),
      notifications.page,
      notifications.limit,
      notifications.total,
    );
  }

  @Patch(':id/read')
  @ApiData(NotificationResponseDto, {
    description: 'Marks one visible notification as read',
    errors: [400, 401, 404, 429],
  })
  async markRead(
    @Param() params: NotificationParamDto,
    @CurrentUser() actor: Express.User,
  ): Promise<NotificationResponseDto> {
    const notification = await this.notificationsService.markRead(
      params.id,
      actor,
    );
    return this.toResponse(notification);
  }

  private toResponse(notification: Notification): NotificationResponseDto {
    return {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      entityType: notification.entityType,
      entityId: notification.entityId,
      workflowInstanceId: notification.workflowInstanceId,
      isRead: notification.isRead,
      readAt: notification.readAt?.toISOString() ?? null,
      createdAt: notification.createdAt.toISOString(),
    };
  }
}
