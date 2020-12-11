import { Router } from 'express';

import ContactsCtrl from '../controllers/ContactsController';

const router = Router();

router.get('/api/contacts/search', ContactsCtrl.searchContacts);

export default router;