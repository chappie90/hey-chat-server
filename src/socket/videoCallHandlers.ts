import { Socket } from 'socket.io';
const mongoose = require('mongoose');

const User = mongoose.model('User');

// User sends offer to start video call
export const onSendOfferVideoCall = async (
  io: Socket,
  socket: Socket, 
  users: { [key: string]: Socket },
  data: string
): Promise<void> => {
  console.log('video call offer received')

  const { userId } = JSON.parse(data);

  const user = await User.findOne({ _id: userId });
  const newProfileImage = user.profile.image.small.path;

  // Notify all active contacts of new profile image
  const imageData = { userId, profileImage: newProfileImage };
  socket.broadcast.to(userId).emit('profile_image_updated', JSON.stringify(imageData));
};
