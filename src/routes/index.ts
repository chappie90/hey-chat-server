import authRoutes from './authRoutes';
import contactsRoutes from './contactsRoutes';
import chatsRoutes from './chatsRoutes';
import pushNotifcationsRoutes from './pushNotificationsRoutes';
import callRoutes from './callRoutes';

module.exports = function(app) {
  app.use(authRoutes);
  app.use(contactsRoutes);
  app.use(chatsRoutes);
  app.use(pushNotifcationsRoutes);
  app.use(callRoutes);
};