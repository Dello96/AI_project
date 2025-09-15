import { supabase } from './supabase'
import { Event, User } from '@/types'
import { emailService } from './emailService'

export interface PushNotification {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: any
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

export interface EventNotification {
  eventId: string
  eventTitle: string
  eventDate: Date
  notificationType: 'created' | 'updated' | 'reminder' | 'cancelled'
  recipients: string[] // 사용자 ID 배열
}

class NotificationService {
  private async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('이 브라우저는 알림을 지원하지 않습니다.')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission === 'denied') {
      console.warn('알림 권한이 거부되었습니다.')
      return false
    }

    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  private async sendPushNotification(notification: PushNotification): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermission()
      if (!hasPermission) {
        return false
      }

      const serviceWorkerRegistration = await navigator.serviceWorker.ready
      
      await serviceWorkerRegistration.showNotification(notification.title, {
        body: notification.body,
        icon: notification.icon || '/favicon.ico',
        badge: notification.badge || '/favicon.ico',
        ...(notification.tag && { tag: notification.tag }),
        data: notification.data,
        requireInteraction: true,
        silent: false
      })

      return true
    } catch (error) {
      console.error('푸시 알림 발송 실패:', error)
      return false
    }
  }

  // 일정 생성 알림
  async notifyEventCreated(event: Event, recipients: User[]): Promise<void> {
    const notification: PushNotification = {
      title: '새로운 일정이 등록되었습니다',
      body: `${event.title} - ${new Date(event.startDate).toLocaleDateString('ko-KR')}`,
      tag: `event-${event.id}`,
      data: {
        eventId: event.id,
        type: 'event_created'
      },
      actions: [
        {
          action: 'view',
          title: '보기'
        }
      ]
    }

    // 푸시 알림 발송
    await this.sendPushNotification(notification)

    // 이메일 알림 발송
    const recipientEmails = recipients.map(u => u.email)
    await emailService.sendEventEmail(
      recipientEmails,
      event.title,
      new Date(event.startDate).toLocaleDateString('ko-KR'),
      'created',
      `/calendar?event=${event.id}`
    )

    // 데이터베이스에 알림 기록 저장
    await this.saveNotificationToDatabase({
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.startDate,
      notificationType: 'created',
      recipients: recipients.map(u => u.id)
    })
  }

  // 일정 수정 알림
  async notifyEventUpdated(event: Event, recipients: User[]): Promise<void> {
    const notification: PushNotification = {
      title: '일정이 수정되었습니다',
      body: `${event.title} - ${new Date(event.startDate).toLocaleDateString('ko-KR')}`,
      tag: `event-${event.id}`,
      data: {
        eventId: event.id,
        type: 'event_updated'
      },
      actions: [
        {
          action: 'view',
          title: '보기'
        }
      ]
    }

    await this.sendPushNotification(notification)

    // 이메일 알림 발송
    const recipientEmails = recipients.map(u => u.email)
    await emailService.sendEventEmail(
      recipientEmails,
      event.title,
      new Date(event.startDate).toLocaleDateString('ko-KR'),
      'updated',
      `/calendar?event=${event.id}`
    )

    await this.saveNotificationToDatabase({
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.startDate,
      notificationType: 'updated',
      recipients: recipients.map(u => u.id)
    })
  }

  // 일정 취소 알림
  async notifyEventCancelled(event: Event, recipients: User[]): Promise<void> {
    const notification: PushNotification = {
      title: '일정이 취소되었습니다',
      body: `${event.title} - ${new Date(event.startDate).toLocaleDateString('ko-KR')}`,
      tag: `event-${event.id}`,
      data: {
        eventId: event.id,
        type: 'event_cancelled'
      }
    }

    await this.sendPushNotification(notification)

    await this.saveNotificationToDatabase({
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.startDate,
      notificationType: 'cancelled',
      recipients: recipients.map(u => u.id)
    })
  }

  // 일정 리마인더 알림
  async notifyEventReminder(event: Event, recipients: User[]): Promise<void> {
    const notification: PushNotification = {
      title: '일정 리마인더',
      body: `${event.title} - ${new Date(event.startDate).toLocaleDateString('ko-KR')} ${new Date(event.startDate).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`,
      tag: `event-${event.id}`,
      data: {
        eventId: event.id,
        type: 'event_reminder'
      },
      actions: [
        {
          action: 'view',
          title: '보기'
        },
        {
          action: 'snooze',
          title: '5분 후 다시'
        }
      ]
    }

    await this.sendPushNotification(notification)

    await this.saveNotificationToDatabase({
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.startDate,
      notificationType: 'reminder',
      recipients: recipients.map(u => u.id)
    })
  }

  // 데이터베이스에 알림 기록 저장
  private async saveNotificationToDatabase(notification: EventNotification): Promise<void> {
    try {
      const notifications = notification.recipients.map(recipientId => ({
        user_id: recipientId,
        title: this.getNotificationTitle(notification.notificationType),
        message: this.getNotificationMessage(notification),
        type: 'event',
        related_id: notification.eventId,
        is_read: false
      }))

      const { error } = await supabase
        .from('notifications')
        .insert(notifications)

      if (error) {
        console.error('알림 저장 실패:', error)
      }
    } catch (error) {
      console.error('알림 저장 중 오류:', error)
    }
  }

  private getNotificationTitle(type: EventNotification['notificationType']): string {
    switch (type) {
      case 'created':
        return '새로운 일정 등록'
      case 'updated':
        return '일정 수정'
      case 'cancelled':
        return '일정 취소'
      case 'reminder':
        return '일정 리마인더'
      default:
        return '일정 알림'
    }
  }

  private getNotificationMessage(notification: EventNotification): string {
    const dateStr = new Date(notification.eventDate).toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })

    switch (notification.notificationType) {
      case 'created':
        return `${notification.eventTitle} 일정이 ${dateStr}에 등록되었습니다.`
      case 'updated':
        return `${notification.eventTitle} 일정이 수정되었습니다. (${dateStr})`
      case 'cancelled':
        return `${notification.eventTitle} 일정이 취소되었습니다. (${dateStr})`
      case 'reminder':
        return `${notification.eventTitle} 일정이 ${dateStr}에 예정되어 있습니다.`
      default:
        return `${notification.eventTitle} 일정 관련 알림입니다.`
    }
  }

  // 일정 리마인더 스케줄링
  async scheduleEventReminder(event: Event, reminderMinutes: number = 30): Promise<void> {
    const reminderTime = new Date(event.startDate.getTime() - reminderMinutes * 60 * 1000)
    const now = new Date()

    if (reminderTime <= now) {
      // 이미 지난 시간이면 즉시 알림
      return
    }

    const delay = reminderTime.getTime() - now.getTime()

    setTimeout(async () => {
      // 리마인더 시간이 되면 알림 발송
      const { data: users } = await supabase
        .from('user_profiles')
        .select('id, email, name, phone, avatar_url, role, is_approved, created_at, updated_at, church_domain_id')
        .eq('church_domain_id', event.churchDomain || 'default')

      if (users) {
        const transformedUsers: User[] = users.map(user => ({
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          avatarUrl: user.avatar_url,
          role: user.role,
          isApproved: user.is_approved,
          churchDomain: user.church_domain_id,
          createdAt: new Date(user.created_at),
          updatedAt: new Date(user.updated_at)
        }))
        await this.notifyEventReminder(event, transformedUsers)
      }
    }, delay)
  }

  // 모든 일정 리마인더 스케줄링
  async scheduleAllEventReminders(): Promise<void> {
    try {
      const now = new Date()
      const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 1주일 후까지

      const { data: events } = await supabase
        .from('events')
        .select('*')
        .gte('start_date', now.toISOString())
        .lte('start_date', futureDate.toISOString())

      if (events) {
        events.forEach(event => {
          this.scheduleEventReminder(event, 30) // 30분 전 리마인더
        })
      }
    } catch (error) {
      console.error('일정 리마인더 스케줄링 실패:', error)
    }
  }

  // 공지사항 알림 발송
  async notifyPostCreated(post: any, recipients: User[]): Promise<void> {
    const notification: PushNotification = {
      title: '새로운 공지사항이 등록되었습니다',
      body: post.title,
      tag: `post-${post.id}`,
      data: {
        postId: post.id,
        type: 'post_created'
      },
      actions: [
        {
          action: 'view',
          title: '보기'
        }
      ]
    }

    // 푸시 알림 발송
    await this.sendPushNotification(notification)

    // 이메일 알림 발송
    const recipientEmails = recipients.map(u => u.email)
    await emailService.sendNotificationEmail(
      recipientEmails,
      '새로운 공지사항',
      `새로운 공지사항이 등록되었습니다.\n\n제목: ${post.title}\n\n자세한 내용은 아래 링크를 클릭하여 확인하세요.`,
      `/board/${post.id}`
    )

    // 데이터베이스에 알림 기록 저장
    await this.saveNotificationToDatabase({
      eventId: post.id,
      eventTitle: post.title,
      eventDate: new Date(),
      notificationType: 'created',
      recipients: recipients.map(u => u.id)
    })
  }

  // 시스템 알림 발송
  async sendSystemNotification(
    title: string,
    message: string,
    recipients: User[],
    actionUrl?: string
  ): Promise<void> {
    const notification: PushNotification = {
      title,
      body: message,
      tag: 'system',
      data: {
        type: 'system'
      }
    }

    // 푸시 알림 발송
    await this.sendPushNotification(notification)

    // 이메일 알림 발송
    const recipientEmails = recipients.map(u => u.email)
    await emailService.sendSystemEmail(
      recipientEmails,
      title,
      message,
      actionUrl
    )

    // 데이터베이스에 알림 기록 저장
    await this.saveNotificationToDatabase({
      eventId: 'system',
      eventTitle: title,
      eventDate: new Date(),
      notificationType: 'created',
      recipients: recipients.map(u => u.id)
    })
  }
}

export const notificationService = new NotificationService()

