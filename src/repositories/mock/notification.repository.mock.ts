/**
 * notification.repository.mock.ts — NotificationRepositoryモック実装（サーバー用）
 *
 * 【依存方向】
 * NotificationRepository → notificationStore（正しい方向）
 *
 * 準拠: DL-030, DL-042
 */

import {
  getAllNotifications,
  getNotificationsForStaff,
  addNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
} from '../../api/services/notificationStore'
import type { NotificationRepository } from '../types'

export const mockNotificationRepo: NotificationRepository = {
  getAll: async () => getAllNotifications(),
  getForStaff: async (staffId) => getNotificationsForStaff(staffId),
  add: async (notification) => addNotification(notification),
  markAsRead: async (id, staffId) => markAsRead(id, staffId),
  markAllAsRead: async (staffId) => markAllAsRead(staffId),
  deleteById: async (id) => deleteNotification(id),
  clearAll: async () => clearAllNotifications(),
}
