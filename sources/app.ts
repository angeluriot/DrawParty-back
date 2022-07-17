import { Server, Socket } from 'socket.io';
import express from 'express';
import http from 'http';
import cors from 'cors';
import type { User } from './User.js';
const port = 3001;

const app = express();
const server = http.createServer(app);

const corsOptions = {
	origin: 'http://localhost:3000',
	optionsSuccessStatus: 200,
};

const io = new Server(server, { cors: corsOptions });

app.use(cors(corsOptions));

let users = new Map<string, User>();

io.on('connection', (socket: Socket) => {
	console.log("a user connected");

	socket.on('disconnect', () => {
		console.log('a user disconnected');
	});

	socket.on('message', (message: string) => {
		console.log('message: ' + message);
		socket.broadcast.emit('broadcastMessage', socket.id, message);
	});

	socket.on('join', (user: User) =>
	{
		users.set(socket.id, user);
		socket.emit('users', [...users.values()]);
		socket.broadcast.emit('newUser', user);
	});
});

server.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});
