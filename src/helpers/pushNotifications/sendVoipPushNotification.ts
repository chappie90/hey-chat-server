import apn from 'apn';

const sendVoipPushNotification = async (
  deviceOS: string,
  voipDeviceToken: string,
  data: any,
  type: string
): Promise<void> => {
  let notification;

  console.log(voipDeviceToken)
  
  if (deviceOS === 'ios') {
    console.log('inside voip ios')
    notification = new apn.Notification({
      "aps":{
        "uuid": data.callId,
        "callerName": data.caller.username,
        "handle": data.caller.username
      },
      "payload":JSON.stringify(data)
    });
    notification.pushType = 'voip';
    notification.topic = `${process.env.APP_ID}.voip`;

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