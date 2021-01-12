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
  onMakeCallOffer, 
  onSendICECandidate,
  onAcceptCall, 
  onRejectCall,
  onCancelCall,
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

    // // User tries to initiate call
    // socket.on('make_call_offer', (data: string) => {
    //   onMakeCallOffer(io, socket, users, data);
    // });

    // User sends ice candidate
    socket.on('send_ice_candidate', (data: string) => {
      onSendICECandidate(io, socket, users, data);
    });

    // Recipient accepts incoming call
    socket.on('accept_call', (data: string) => {
      onAcceptCall(io, socket, users, data);
    });

    // Recipient rejects incoming call
    socket.on('reject_call', (data: string) => {
      onRejectCall(io, socket, users, data);
    });

    // Caller cancels outgoing call
    socket.on('cancel_call', (data: string) => {
      onCancelCall(io, socket, users, data);
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
