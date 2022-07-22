import { Server, Socket } from 'socket.io';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { DrawTest } from './socketdraw.js';

const port = 3001;

const app = express();
const server = http.createServer(app);

const corsOptions = {
	origin: 'http://localhost:3000',
	optionsSuccessStatus: 200,
};

const io = new Server(server, { cors: corsOptions });

const drawTest = new DrawTest();

app.use(cors(corsOptions));

io.on('connection', (socket: Socket) => {
	console.log("a user connected");

	socket.on('disconnect', () => {
		console.log('a user disconnected');
	});

	socket.on('message', (msg) => {
		console.log('message: ' + msg);
		socket.broadcast.emit('broadcastMessage', msg);
	});

	drawTest.init(io, socket);
});

setInterval(() => {drawTest.update(io)}, 1 / 25 * 1000);

server.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});
