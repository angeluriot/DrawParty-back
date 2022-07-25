import { Server, Socket } from 'socket.io';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { connectionEvents } from './connection.js';
import Global from './Global.js';
import { DrawTest } from './socketdraw.js';

const port = 3001;

const app = express();
const server = http.createServer(app);

const corsOptions = {
	origin: 'http://localhost:3000',
	optionsSuccessStatus: 200,
};

Global.io = new Server(server, { cors: corsOptions });

const drawTest = new DrawTest();

app.use(cors(corsOptions));

Global.io.on('connection', (socket: Socket) =>
{
	connectionEvents(socket);
	drawTest.init(socket);
});

setInterval(() => {drawTest.update()}, 1 / 25 * 1000);

server.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});
