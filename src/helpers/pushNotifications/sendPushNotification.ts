import apn from 'apn';

const sendPushNotification = async (
  deviceOS: string,
  deviceToken: string,
  title: string,
  body: string,
  chatId?: string
): Promise<void> => {
  let notification;

  const data = {
    payload: {
      chat: {
        chatId
      }
    }
  };

  if (deviceOS === 'ios') {
    notification = new apn.Notification({
      "aps":{
        "alert":{
          "title":title,
          "body":body,
          "sound":"default",
          // "badge":1
          // "action-loc-key" : "PLAY"
          // "sound" : "bingbong.aiff" / "chime.aiff"
        }
      },
      "payload": {
        "payload": JSON.stringify(data)
      },
      "topic":process.env.APP_ID
    });
    global.apnProvider.send(notification, deviceToken)
      .then( response => {
        // successful device tokens
        console.log(response.sent);
        // failed device tokens
        console.log(response.failed);
      });
  }
  if (deviceOS === 'android') {
    notification = {
      "android":{
        "notification":{
          "title":title,
          "body":body, 
          "sound":"default",
          // "icon":
        },
        "data": {
          "payload": JSON.stringify(data)
        },
        "priority":"high",
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

export default sendPushNotification;