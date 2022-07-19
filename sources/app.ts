import { Server, Socket } from 'socket.io';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { connectionEvents } from './connection.js';
import { Global } from './Global.js';
const port = 3001;

const app = express();
const server = http.createServer(app);

const corsOptions = {
	origin: 'http://localhost:3000',
	optionsSuccessStatus: 200,
};

Global.io = new Server(server, { cors: corsOptions });

app.use(cors(corsOptions));

Global.io.on('connection', (socket: Socket) =>
{
	connectionEvents(socket);
});

server.listen(port, () =>
{
	console.log(`Server is running on port ${port}`);
});
