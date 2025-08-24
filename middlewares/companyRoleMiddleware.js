import { CompanyUser } from '../models/adminModel.js';

// export const roleMiddleware = (allowedRoles = []) => {
//   return async (req, res, next) => {
//     try {
//       const email = req.userEmail; // Set from token/middleware
//       const companyId = req.companyId;

//       const user = await CompanyUser.findOne({ emailId: email, companyId });

//       if (!user || !allowedRoles.includes(user.role)) {
//         return res.status(403).json({ success: false, message: "Access denied" });
//       }

//       next();
//     } catch (err) {
//       return res.status(500).json({ success: false, message: "Authorization error" });
//     }
//   };
// };

export const roleMiddleware = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      const adminId = req.adminId; // Extracted from token in authMiddleware
      const companyId = req.companyId;

      console.log("adminId",adminId)
      console.log("companyId",companyId)

      if (!adminId || !companyId) {
        return res.status(401).json({ success: false, message: "Unauthorized access" });
      }

      const user = await CompanyUser.findOne({ _id: adminId, companyId });

      if (!user || !allowedRoles.includes(user.role)) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }

      next();
    } catch (err) {
      return res.status(500).json({ success: false, message: "Authorization error" });
    }
  };
};