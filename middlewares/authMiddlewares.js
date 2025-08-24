import JWT from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid';

// const userAuth = async(req,res,next) =>{
//     const authHeader = req.headers.authorization;
//     if(!authHeader || !authHeader.startsWith("Bearer")){
//         next('Auth Failed');
//     }
//     const token = authHeader.split(' ')[1];
//     try {
//         const payload = JWT.verify(token , process.env.JWT_SECRET)
//         req.user = {userId : payload.userId}
//         next()
//     } catch (error) {
//         next('Auth Failed')
//     }
// }

const userAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    //Validate token header format
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "Auth Failed: No token provided" });
    }

    const token = authHeader.split(' ')[1];

    try {
        //Decode token and extract adminId & companyId
        const payload = JWT.verify(token, process.env.JWT_ADMIN_SECRET);
        
        req.adminId = payload.adminId;       //Set adminId on request
        req.companyId = payload.companyId;   //Set companyId on request

        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Auth Failed: Invalid token" });
    }
};

export default userAuth;