import { Socket } from "socket.io";

export default class Player
{
	socket: Socket;
	image: string;
	score: number = 0;

	constructor(socket: Socket, image: string)
	{
		this.socket = socket;
		this.image = image;
	}
};
