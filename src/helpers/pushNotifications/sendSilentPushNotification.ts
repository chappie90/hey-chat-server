import apn from 'apn';

const sendSilentPushNotification = async (
  deviceOS: string,
  deviceToken: string,
  data: any,
  type: string,
  chatId?: string
): Promise<void> => {
  let notification;

  if (deviceOS === 'ios') {
    notification = new apn.Notification({
      "aps":{
        "content-available":"1",
        "sound":""
      },
      "topic":process.env.APP_ID,
      "payload":{
        "silent":true,
        "type": type,
        "payload": JSON.stringify(data)
      }
    });
    // notification.pushType = 'voip';
    global.apnProvider.send(notification, deviceToken)
      .then(response => {
        // successful device tokens
        console.log(response.sent);
        // failed device tokens
        console.log(response.failed);
      });
  }

  if (deviceOS === 'android') {
    notification = {
      "android":{
        "priority":"high",
        "data":{
          "silent": "true",
          "type": type,
          "payload": JSON.stringify(data)
        }
      },
      token:deviceToken
    };

    global.firebaseAdmin.messaging().send(notification)
      .then((response) => {
        // Response is a message ID string.
        console.log('Successfully sent message:', response);
      })
      .catch((error) => {
        console.log('Error sending message:', error);
      });
  }
};

export default sendSilentPushNotification;