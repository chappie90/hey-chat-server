import { Request, Response, NextFunction } from 'express';
const mongoose = require('mongoose');

const User = mongoose.model('User');

const searchContacts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { username } = req.query;

  let search = req.query.search;
  search = (search as string).replace(/[-[\]{}()*+?.,\\/^$|#\s]/g, "\\$&");

  try {
    const contacts = await User.find({ 
      username: { 
        $regex: new RegExp(search, 'i'),
        $ne: username 
      } 
    }, 
    { username: 1, 'avatar.small.name': 1 }).limit(10);

    res.status(200).send({ contacts });  
  } catch (err) {
    console.log(err);
    next(err);
  }
};

export default {
  searchContacts
};