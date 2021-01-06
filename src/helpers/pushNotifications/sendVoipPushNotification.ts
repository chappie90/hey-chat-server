import apn from 'apn';

const sendVoipPushNotification = async (
  deviceOS: string,
  voipDeviceToken: string,
  data: any,
  type: string
): Promise<void> => {
  let notification;

  if (deviceOS === 'ios') {
    notification = new apn.Notification({
      "aps":{
        "uuid": data.callId,
        "callerName": data.calller.username,
        "handle": data.calller.username
      },
      "topic":process.env.APP_ID,
      "payload":JSON.stringify(data)
    });
    notification.pushType = 'voip';

    console.log(notification)

    global.apnProvider.send(notification, voipDeviceToken)
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
          "type":type,
          "payload":JSON.stringify(data)
        }
      },
      token:voipDeviceToken
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

export default sendVoipPushNotification;