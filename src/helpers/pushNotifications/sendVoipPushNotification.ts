import apn from 'apn';

const sendVoipPushNotification = async (
  voipDeviceToken: string,
  data: any
): Promise<void> => {
  let notification;
  
  notification = new apn.Notification({
    "payload": {
      "uuid": data.callId,
      "callerName": data.caller.username,
      "handle": data.caller.username,
      "hasVideo": data.callType === 'video' ? 'YES' : 'NO',
      "data":JSON.stringify(data)
    }
  });
  notification.pushType = 'voip';
  notification.topic = `${process.env.APP_ID}.voip`;

  global.apnProvider.send(notification, voipDeviceToken)
    .then(response => {
      // successful device tokens
      console.log(response.sent);
      // failed device tokens
      console.log(response.failed);
    });
};

export default sendVoipPushNotification;