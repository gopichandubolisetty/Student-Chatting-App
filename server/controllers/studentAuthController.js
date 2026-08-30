const Student = require('../models/Student');
const {OAuth2Client} = require('google-auth-library');
const jwt = require('jsonwebtoken');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.googleLogin = async(req,res)=>{
    try{
        const {idToken} = req.body;
        if(!idToken){
            return res.status(400).json({message:'Google ID is token required'});
        }

        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience:process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const {sub:googleId,email,name, picture:avatar,hd}= payload;

        const REQUIRED_DOMAIN = 'vitapstudent.ac.in';
        const hasValidDomain = email.endsWith(`@${REQUIRED_DOMAIN}`) || hd==REQUIRED_DOMAIN;

        if(!hasValidDomain){
            return res.status(403).json({message:`Access denied. You must use an official @${REQUIRED_DOMAIN}`});
        }

        let student  = await Student.findOne({googleId});

        if(!student){
            student = await Student.create({
                googleId,
                email:email.toLowerCase(),
                name,
                avatar
            });
        }

        const token = jwt.sign(
            {id:student._id,role:'student'},
            process.env.JWT_SECRET || 'fallback_dev_secret_key',
            {expiresIn:'24h'}
        );

        res.cookie('token',token,{
            httpOnly:true,
            secure:process.env.NODE_ENV ==='production',
            sameSite:'strict',
            maxAge:24*60*60*1000
        });

        res.status(200).json({
            message:'Student authenticated successfully',
            student:{
                id:student._id,
                name:student.name,
                email:student.email,
                avatar:student.avatar,
                role:'studnet'
            }
        });
    }catch(error){
        console.error('Google Auth Error: ',error);
        res.status(401).json({message: 'Invalid or expired Google Token'});
    }
};