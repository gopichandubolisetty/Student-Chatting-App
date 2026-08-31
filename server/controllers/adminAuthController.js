const Admin = require('../models/Admin');
const crypto = require('crypto');
const jwt = require('jsonwebtokens');

exports.requestOtp = async(req,res)=>{

    try{
        const {email} = req.body;

        if(!email || typeof email != 'string'){
            res.status(400).json({message:'A valid email is reqired'});
        }

        const admin = await Admin.findOne({email:email.toLowerCase()});

        if(!admin){
            return res.status(200).json({message:'If the email is registered OTP has been sent'});
        }

        const otp = crypto.randomInt(100000,1000000);
        const otpExpires = new Date(Date.now()+5*60*1000);

        admin.otp = otp;
        admin.otpExpires = otpExpires;
        await admin.save();

        console.log(`[DEV ONLY] OTP for ${admin.email} is ${otp} `);

        res.status(200).json({message:'If the email is registered OTP has been sent'});
    
    } catch(error){
        console.error('OTP Request Error ',error);
        res.status(500).json({message:'Internal server error'});
    }
}

exports.verifyOtp = async(req,res)=>{

    try{
        const {email,otp} = req.body;

        if(!email || !otp){
            return res.status(400).json({message:'Email and OTP are required'});
        }

        const admin = await Admin.findOne({email:email.toLowerCase()});

        if(!admin|| admin.otp.toString()!=otp.toString()){
            return res.status(401).json({message:'Invalid email or OTP'});
        }

        if(new Date()>admin.otpExpires){
            return res.status(401).json({message:'OTP has expired'});
        }
        admin.otp = undefined;
        admin.otpExpires = undefined;

        await admin.save();

        // jwt.sign(payload, secretOrPrivateKey, [options, callback])
        const token = jwt.sign(
            {id:admin._id,role:admin.role},
            process.env.JWT_SECRET || 'fallback_dev_secret_key',
            {expiresIn:'12h'}
        );

        // NEW: Attach token as an httpOnly cookie
        res.cookie('token',token,{
            httpOnly:true,          // Prevents JS from reading the cookie (XSS protection)
            secure:process.env.NODE_ENV === 'production',   //// Requires HTTPS in production
            sameSite:'strict',  // Prevents CSRF attacks
            maxAge:12*60*60*1000   // 12 hours in milliseconds
        });

        res.status(200).json({
            message:'Login Successful',
            admin:{id:admin._id,email:admin.email,role:admin.role}
        });

    } catch(error){
        console.error('OTP Verification Error ',error);
        res.status(500).json({message: 'Internal server error'});
    }
}