// import { configDotenv } from 'dotenv';
// import express from 'express';
// import cors from 'cors';
// import http from 'http'; 
// import { Server } from 'socket.io';
// import { PrismaClient } from '@prisma/client';

const PrismaClient = require('@prisma/client').PrismaClient;
const Server = require('socket.io').Server;
const http = require('http');
const cors = require('cors');
const express = require('express');
// const config = require('dotenv');

const prisma = new PrismaClient(); 

const port = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app); 
const io = new Server(server, {
    cors: {
        origin: '*', 
        methods: ['GET', 'POST'],
    },
});

// config();

app.use(express.json());
app.use(cookieParser());

app.use(
    cors({
        origin: '*', // Allow all origins
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], // Allow common methods
        allowedHeaders: ['Content-Type', 'Authorization'], // Allow specific headers
        preflightContinue: false,
        optionsSuccessStatus: 204,
        credentials: true
    })
);

// Test Route
app.get('/', (req, res) => {
    return res.send('Hello World');
});

// WebSocket connection handler
io.on('connection', (socket) => {
    console.log('a user connected:', socket.id);
    socket.on('updateLocation', async (data) => {
        const { userId, location } = data;

        if (!userId || !location || !location.latitude || !location.longitude) {
            return socket.emit('error', 'Invalid location data');
        }

        try {
            const user = await prisma.user.update({
                where: { id: userId },
                data: { location },
            });

            console.log(`User ${userId} location updated to:`, location);

            io.to('adminChannel').emit('locationUpdated', { userId, location });
        } catch (err) {
            console.error('Error updating location:', err);
            socket.emit('error', 'Failed to update location');
        }
    });

    socket.on('joinAdminChannel', () => {
        socket.join('adminChannel');
        console.log('Admin joined the admin channel');
    });

    socket.on('disconnect', () => {
        console.log('user disconnected:', socket.id);
    });
});

server.listen(port, () => {
    console.log('Server is running on port', port);
});