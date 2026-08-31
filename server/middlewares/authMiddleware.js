const jwt = require('jsonwebtoken');

exports.protect = async(req,res,next)=>{
    try{
        const token = req.cookie.token;

        if(!token){
            return res.status(401).json({message:'Not authorized, no token provided'});
        }

        const decoded = jwt.verify(token,process.env.JWT_SECRET);

        req.user = decoded;

        next();
    }catch(error){
        console.error('JWT Verification Error : ',error.message);
        return res.status(401).json({message: ' Not authorized , token invalid or expired '});
        }
    };




// Using a closure to pass roles dynamically: authorize('admin', 'superadmin')
exports.authorize = (...roles)=>{
    return (req,res,next)=>{
        if(!req.user || !roles.includes(req.user.role)){
            return res.status(403).json({
                message:`Role (${req.user?.role || 'none'}) is not authorized to access this resource`
            });
        }
    }
}


