// src/notification/logic/NotificationDispatcher.ts

import {admin} from '../../config/firebase';

interface NotificationPayload {
  title: string;
  body: string;
}

/**
 * Envia una notificación push a un dispositivo mediante FCM.
 */
export async function sendNotification(
  token: string,
  payload: NotificationPayload
) {
  const message = {
    notification: {
      title: payload.title,
      body: payload.body
    },
    token
  };

  await admin.messaging().send(message);
}
