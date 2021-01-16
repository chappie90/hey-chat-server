import { onConnect, onDisconnect } from './mainHandlers';
import { onUpdateProfileImage } from './profileHandlers';
import { 
  onMessage, 
  onLikeMessage, 
  onDeleteMessage,
  onMarkAllMessagesAsRead,
  onStartTyping,
  onStopTyping
} from './chatsHandlers';
import { 
  onSendSdpOffer, 
  onSendICECandidate,
  onSendSdpAnswer, 
  onEndCall
} from './callHandlers';
import { Socket } from 'socket.io';

const users: { [key: string]: Socket } = {};

const initSocket = (io: Socket) => {
  // Connect to socket
  io.on('connection', async (socket: Socket) => {
    const { userId, socketId } = await onConnect(io, socket, users);
    
    // To show a list of all room
    // console.log(io.sockets.adapter.rooms);

    // Get the clients in a room
    // io.in(userId).clients((err , clients) => {
    //   console.log(clients);
    // });
  
    // User sends new message
    socket.on('message', (data: string) => {
      onMessage(io, socket, users, data);
    });

    // User likes message
    socket.on('like_message', (data: string) => {
      onLikeMessage(io, users, data);
    });

    // User deletes message
    socket.on('delete_message', (data: string) => {
      onDeleteMessage(io, users, data);
    });

    // User updated profile image
    socket.on('update_profile_image', (data: string) => {
      onUpdateProfileImage(socket, data);
    });

    // User reads messages
    socket.on('mark_messages_as_read', (data: string) => {
      onMarkAllMessagesAsRead(io, socket, users, data);
    });

    // User starts typing
    socket.on('start_typing', (data: string) => {
      onStartTyping(io, socket, users, data);
    });

    // User stops typing
    socket.on('stop_typing', (data: string) => {
      onStopTyping(io, socket, users, data);
    });

    // // User received voip push to wake up device
    // socket.on('receive_voip_push', (data: string) => {
    //   onReceiveVoipPush(io, socket, users, data);
    // });

    // Callee sends sdp offer on call answer
    socket.on('send_sdp_offer', (data: string) => {
      onSendSdpOffer(io, socket, users, data);
    });

    // User sends ice candidate
    socket.on('send_ice_candidate', (data: string) => {
      onSendICECandidate(io, socket, users, data);
    });

    // Caller sends sdp answer
    socket.on('send_sdp_answer', (data: string) => {
      onSendSdpAnswer(io, socket, users, data);
    });

    // Either user ends call
    socket.on('end_call', (data: string) => {
      onEndCall(io, socket, users, data);
    });

    // Disconnect from socket
    socket.on('disconnect', async () => {
      await onDisconnect(io, socket, users, userId);
    });
  });
};

module.exports = {
  initSocket
};
