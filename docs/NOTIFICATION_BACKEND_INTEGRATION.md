# Notification Backend Integration Guide

This guide explains how to integrate push notifications with your NestJS backend to send notifications to all users, including feature announcements.

## Overview

The app uses **Expo Push Notification Service** to send push notifications. Your NestJS backend needs to:
1. Store user push tokens
2. Send notifications via Expo's Push API
3. Handle feature announcements and broadcast notifications

## Frontend Setup

### 1. Get Push Token

The app already retrieves the Expo push token in `services/useNotifications.ts`. You need to send this token to your backend when:
- User logs in
- Token changes (handled by `addPushTokenListener`)
- User enables notifications

### 2. Send Token to Backend

Add this to your authentication/login flow:

```typescript
// In your auth service or after login
import { useNotifications } from '@/services/useNotifications';

// After successful login
const { expoPushToken } = useNotifications();

if (expoPushToken) {
  await fetch('https://your-api.com/api/users/push-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      pushToken: expoPushToken,
      deviceId: Device.osInternalBuildId || 'unknown',
      platform: Platform.OS, // 'ios' or 'android'
    }),
  });
}
```

### 3. Listen for Token Changes

Add a token listener in your app root or auth context:

```typescript
import * as Notifications from 'expo-notifications';

useEffect(() => {
  const subscription = Notifications.addPushTokenListener(async (tokenData) => {
    // Token changed, update backend
    await updatePushTokenOnBackend(tokenData.data);
  });

  return () => subscription.remove();
}, []);
```

## Backend Setup (NestJS)

### 1. Install Dependencies

```bash
npm install @nestjs/axios axios
```

### 2. Create Push Token Entity

```typescript
// entities/push-token.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('push_tokens')
export class PushToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, user => user.pushTokens)
  user: User;

  @Column()
  token: string;

  @Column()
  deviceId: string;

  @Column()
  platform: 'ios' | 'android';

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### 3. Create Push Notification Service

```typescript
// services/push-notification.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PushToken } from '../entities/push-token.entity';

interface ExpoPushMessage {
  to: string;
  sound?: 'default';
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  channelId?: string;
}

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);
  private readonly EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

  constructor(
    @InjectRepository(PushToken)
    private pushTokenRepository: Repository<PushToken>,
    private httpService: HttpService,
  ) {}

  /**
   * Send notification to a single user
   */
  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
    channelId?: string,
  ): Promise<void> {
    const tokens = await this.pushTokenRepository.find({
      where: { user: { id: userId }, isActive: true },
    });

    if (tokens.length === 0) {
      this.logger.warn(`No push tokens found for user ${userId}`);
      return;
    }

    const messages: ExpoPushMessage[] = tokens.map((token) => ({
      to: token.token,
      sound: 'default',
      title,
      body,
      data: {
        ...data,
        channelId: channelId || 'default',
      },
      badge: 1,
      channelId: channelId || 'default',
    }));

    await this.sendPushNotifications(messages);
  }

  /**
   * Send notification to all users (broadcast)
   */
  async sendToAllUsers(
    title: string,
    body: string,
    data?: Record<string, any>,
    channelId: string = 'marketing',
  ): Promise<void> {
    const tokens = await this.pushTokenRepository.find({
      where: { isActive: true },
    });

    if (tokens.length === 0) {
      this.logger.warn('No active push tokens found');
      return;
    }

    // Expo allows up to 100 messages per request
    const batchSize = 100;
    const batches: ExpoPushMessage[][] = [];

    for (let i = 0; i < tokens.length; i += batchSize) {
      const batch = tokens.slice(i, i + batchSize).map((token) => ({
        to: token.token,
        sound: 'default',
        title,
        body,
        data: {
          ...data,
          channelId,
        },
        badge: 1,
        channelId,
      }));
      batches.push(batch);
    }

    // Send batches in parallel
    await Promise.all(
      batches.map((batch) => this.sendPushNotifications(batch))
    );

    this.logger.log(`Sent notification to ${tokens.length} users`);
  }

  /**
   * Send feature announcement to all users
   */
  async sendFeatureAnnouncement(
    featureName: string,
    description: string,
  ): Promise<void> {
    await this.sendToAllUsers(
      `New Feature: ${featureName} ✨`,
      description,
      {
        type: 'feature_announcement',
        featureName,
        description,
        url: '/home',
      },
      'marketing',
    );
  }

  /**
   * Send push notifications via Expo API
   */
  private async sendPushNotifications(messages: ExpoPushMessage[]): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(this.EXPO_PUSH_URL, messages, {
          headers: {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
        }),
      );

      // Check for errors in response
      if (response.data.data) {
        const errors = response.data.data.filter(
          (result: any) => result.status === 'error',
        );
        if (errors.length > 0) {
          this.logger.error('Some push notifications failed:', errors);
        }
      }
    } catch (error) {
      this.logger.error('Failed to send push notifications:', error);
      throw error;
    }
  }

  /**
   * Register or update push token for user
   */
  async registerToken(
    userId: string,
    token: string,
    deviceId: string,
    platform: 'ios' | 'android',
  ): Promise<void> {
    const existing = await this.pushTokenRepository.findOne({
      where: { token, user: { id: userId } },
    });

    if (existing) {
      existing.deviceId = deviceId;
      existing.platform = platform;
      existing.isActive = true;
      existing.updatedAt = new Date();
      await this.pushTokenRepository.save(existing);
    } else {
      const pushToken = this.pushTokenRepository.create({
        user: { id: userId },
        token,
        deviceId,
        platform,
        isActive: true,
      });
      await this.pushTokenRepository.save(pushToken);
    }
  }

  /**
   * Deactivate push token (e.g., on logout)
   */
  async deactivateToken(token: string): Promise<void> {
    await this.pushTokenRepository.update(
      { token },
      { isActive: false },
    );
  }
}
```

### 4. Create Controller Endpoints

```typescript
// controllers/push-notification.controller.ts
import { Controller, Post, Body, UseGuards, Get, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PushNotificationService } from '../services/push-notification.service';
import { GetUser } from '../decorators/get-user.decorator'; // Your user decorator

@Controller('api/notifications')
export class PushNotificationController {
  constructor(
    private pushNotificationService: PushNotificationService,
  ) {}

  @Post('register-token')
  @UseGuards(AuthGuard('jwt'))
  async registerToken(
    @GetUser() user: any,
    @Body() body: { token: string; deviceId: string; platform: 'ios' | 'android' },
  ) {
    await this.pushNotificationService.registerToken(
      user.id,
      body.token,
      body.deviceId,
      body.platform,
    );
    return { success: true };
  }

  @Post('send-feature-announcement')
  @UseGuards(AuthGuard('jwt')) // Add admin guard
  async sendFeatureAnnouncement(
    @Body() body: { featureName: string; description: string },
  ) {
    await this.pushNotificationService.sendFeatureAnnouncement(
      body.featureName,
      body.description,
    );
    return { success: true, message: 'Feature announcement sent to all users' };
  }

  @Post('broadcast')
  @UseGuards(AuthGuard('jwt')) // Add admin guard
  async broadcast(
    @Body() body: { title: string; body: string; data?: Record<string, any>; channelId?: string },
  ) {
    await this.pushNotificationService.sendToAllUsers(
      body.title,
      body.body,
      body.data,
      body.channelId,
    );
    return { success: true };
  }
}
```

### 5. Module Setup

```typescript
// push-notification.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { PushToken } from './entities/push-token.entity';
import { PushNotificationService } from './services/push-notification.service';
import { PushNotificationController } from './controllers/push-notification.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([PushToken]),
    HttpModule,
  ],
  providers: [PushNotificationService],
  controllers: [PushNotificationController],
  exports: [PushNotificationService],
})
export class PushNotificationModule {}
```

## Usage Examples

### Send Feature Announcement (Admin)

```bash
POST /api/notifications/send-feature-announcement
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "featureName": "Portfolio Analytics",
  "description": "Track your investments with our new advanced analytics dashboard!"
}
```

### Send Custom Broadcast (Admin)

```bash
POST /api/notifications/broadcast
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "title": "Maintenance Notice",
  "body": "Scheduled maintenance on Dec 25, 2024 from 2-4 AM EST",
  "data": {
    "type": "maintenance",
    "url": "/home"
  },
  "channelId": "default"
}
```

### Send to Specific User

```typescript
// In your service
await pushNotificationService.sendToUser(
  userId,
  'Investment Update',
  'Your property investment has reached 50% funding!',
  { type: 'property_update', propertyId: '123' },
  'property',
);
```

## Notification Channels

The app uses these channels (configured in Android):
- `default` - General notifications
- `investment` - Investment updates
- `property` - Property alerts
- `security` - Security alerts (always shown)
- `marketing` - Marketing & feature announcements

## Important Notes

1. **Rate Limits**: Expo has rate limits. For high-volume sends, consider:
   - Batching requests (max 100 per request)
   - Using a queue system (Bull/BullMQ)
   - Implementing retry logic

2. **Token Management**: 
   - Deactivate tokens on logout
   - Remove invalid tokens (handle errors from Expo API)
   - Update tokens when they change

3. **Error Handling**: 
   - Expo returns errors for invalid tokens
   - Implement cleanup for failed tokens
   - Log errors for monitoring

4. **Testing**: 
   - Use Expo's push notification tool: https://expo.dev/notifications
   - Test on physical devices (simulators don't receive push notifications)

## Frontend Hook for Feature Announcements

You can also create a hook to manually trigger feature announcements from the frontend (for testing):

```typescript
// hooks/useFeatureAnnouncement.ts
import { useCallback } from 'react';
import { NotificationHelper } from '@/services/notificationHelper';
import { useApp } from '@/contexts/AppContext';

export function useFeatureAnnouncement() {
  const { state } = useApp();

  const announceFeature = useCallback(
    async (featureName: string, description: string) => {
      await NotificationHelper.featureAnnouncement(
        featureName,
        description,
        state.notificationSettings,
      );
    },
    [state.notificationSettings],
  );

  return { announceFeature };
}
```

## Next Steps

1. Set up your NestJS backend with the above code
2. Update your frontend auth flow to register push tokens
3. Test with Expo's push notification tool
4. Implement admin panel for sending announcements
5. Set up monitoring and error handling

