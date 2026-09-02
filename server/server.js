const cookieParser = require('cookie-parser');
const express = require('express');
const http = require('http');
const {server} = require('socket.io');
const cookie = require('cookie');
const jwt = require('jsonwebtoken');
require('dotenv').config();


const app = express();
app.use(cookieParser());

const server = http.createServer(app);

const io= new Server(server,{
    cors:{
        origin:'http://localhost:5173',
        credentials:true
    }
});

io.use((socket,next)=>{
    try{
        const rawCookies = socket.request.headers.cookie;  //srh c
        if(!rawCookies){
            return next(new Error('Authentication error: No cookie found'));
        }
        const parsedCookies = cookie.parse(rawCookies);
        const token = parsedCookies.token;

        if(!token){
            return next(new Error('Authentication error: Token missing'));
        }

        const decoded = jwt.verify(token,process.env.JWT_SECRET);

        socket.user = decoded;

        next();
    }catch(error){
        console.error('Socket Auth Error:',error.message);
        next(new Error('Authentication error: Invalid token'));
    }
});

io.on('connection',(socket)=>{
    console.log(`User connected via socket ${socket.user.id} (Role : ${socket.user.role})`);

    socket.on('disconnect',()=>{
        console.log('User disconnected');
    });
});

const port = process.env.PORT||5000;
server.listen(PORT,()=> console.log(`Server running on port${PORT}`));