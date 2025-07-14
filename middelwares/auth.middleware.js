import jwt from 'jsonwebtoken'
import { User } from '../models/user.model.js'
import { apierror } from '../utils/apierror.js'
import { asynchandler } from '../utils/asynchandler.js'



export const verifyjwt = asynchandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accesstoken || req.header('Authorization')?.replace('Bearer ', '');
         
        if (!token) {
            throw new apierror(401, "No token provided");
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
 

        const user = await User.findById(decoded?.id).select('-password');
        if (!user) {
            throw new apierror(404, "User not found");
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("JWT Error:", error.message);
        throw new apierror(401, error.message || "Please authenticate");
    }
});
