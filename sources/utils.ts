import { Socket } from 'socket.io';

export function createPartyId()
{
	let result = '';
	let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

	for (let i = 0; i < 20; i++)
		result += characters.charAt(Math.floor(Math.random() * characters.length));

	return result;
}

export function getPartyId(socket: Socket)
{
	for (let room of socket.rooms)
		if (room != socket.id)
			return room;

	return null;
}
