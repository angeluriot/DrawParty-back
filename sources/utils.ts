import { Socket } from 'socket.io';
import { isThisTypeNode } from 'typescript';
import Global from './Global.js';

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

	return undefined;
}

export function getParty(socket: Socket)
{
	let partyId;

	for (let room of socket.rooms)
		if (room != socket.id)
		{
			partyId = room;
			break;
		}

	if (!partyId)
		return undefined;

	return Global.parties.get(partyId);
}

export function is(value: any, type: string)
{
	return value != null && value != undefined && typeof value === type;
}

export function isInt(int: number, min: number, max: number)
{
	return is(int, 'number') && Number.isSafeInteger(int) && int >= min && int <= max;
}

export function isIndex(index: number, array: any[])
{
	return isInt(index, 0, array.length - 1);
}
