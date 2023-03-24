import { Injectable, Injector } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications, LocalNotificationSchema } from '@capacitor/local-notifications';
import { SharedService } from 'src/app/services/shared/shared.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(private injector: Injector) { }

  async schedule(key: string, notifications: LocalNotificationSchema) {
    if (Capacitor.isPluginAvailable('LocalNotifications')) {
      const shared = this.injector.get(SharedService);
      const ids = shared.notificationIds;

      const newNotification = {
        id: ids.length
          ? Math.max(...ids.map((item: any) => item.id)) + 1
          : 0,
        title: notifications.title,
        key
      };

      ids.push(newNotification);
      shared.setNotificationIds(ids);

      await LocalNotifications.schedule({
        notifications: [{
          ...notifications,
          id: newNotification.id,
          title: notifications.title
        }]
      });
    }
  }

  async cancel(title: string, key?: string) {
    if (Capacitor.isPluginAvailable('LocalNotifications')) {
      const shared = this.injector.get(SharedService);
      const ids = shared.notificationIds;

      const idToBeDeleted = ids
        .filter((item: any) =>
          key ? item.title === title && item.key === key : item.title === title
        )
        .map(({ id }) => ({ id }));

      if (idToBeDeleted?.length) {
        const deletedIds = idToBeDeleted.map(({ id }) => id);
        const newIds = ids.filter((item: any) => !deletedIds.includes(item.id));
        shared.setNotificationIds(newIds);

        await LocalNotifications.cancel({
          notifications: idToBeDeleted
        });
      }
    }
  }

  async cancelAll() {
    if (Capacitor.isPluginAvailable('LocalNotifications')) {
      const shared = this.injector.get(SharedService);

      const idToBeDeleted = shared.notificationIds
        .map(({ id }) => ({ id }));

      if (idToBeDeleted?.length) {
        await LocalNotifications.cancel({
          notifications: idToBeDeleted
        });

        shared.setNotificationIds([]);
      }
    }
  }
}
