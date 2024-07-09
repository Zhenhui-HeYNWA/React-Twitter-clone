import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';
export const protectRoute = async (req, res, next) => {
  try {
    //get token from the  cookies
    const token = req.cookies.jwt;
    //check the token is valid or not
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized:No Token Provided' });
    }
    //check if there is a token but is invalid or not
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized:Invalid Token' });
    }
    //find the user from the db remove the password field
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not Found!' });
    }

    req.user = user;
    //call the next function
    next();
  } catch (error) {
    console.log('Error is protectRouter controller', error.message);

    res.status(500).json({ error: 'Internal server Error' });
  }
};
