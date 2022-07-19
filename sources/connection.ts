import { Socket } from 'socket.io';
import { Global } from './Global.js';
import { Party } from './Party.js';
import { Player } from './Player.js';
import * as Utils from './utils.js';

function checkParty(socket: Socket, partyId: string)
{
	let party = Global.parties.get(partyId);
	return Utils.getPartyId(socket) == null && party != undefined && !party.started && !party.full();
}

export function connectionEvents(socket: Socket)
{
	console.log(`Player ${socket.id} connected`);

	socket.on('createParty', (image: string) =>
	{
		if (Utils.getPartyId(socket) != null)
		{
			socket.emit('error');
			return;
		}

		else
		{
			let partyId = Utils.createPartyId();
			let player = new Player(socket.id, image);
			Global.parties.set(partyId, new Party(partyId, player));
			socket.join(partyId);
			socket.emit('partyCreated', partyId);
			console.log(`Party ${partyId} created by ${socket.id}`);
		}
	});

	socket.on('checkParty', (partyId: string) =>
	{
		if (!checkParty(socket, partyId))
			socket.emit('error');
	});

	socket.on('joinParty', (partyId: string, image: string) =>
	{
		if (!checkParty(socket, partyId))
		{
			socket.emit('error');
			return;
		}

		let player = new Player(socket.id, image);
		Global.parties.get(partyId)?.players.push(player);
		socket.join(partyId);
		socket.emit('partyJoined');
		socket.to(partyId).emit('newPlayer', { id: socket.id, image: image });
		console.log(`${socket.id} joined party ${partyId}`);
	});

	socket.on('askPartyData', () =>
	{
		let partyId = Utils.getPartyId(socket);

		if (partyId == null || Global.parties.get(partyId)?.started)
		{
			socket.emit('error');
			return;
		}

		socket.emit('getPartyData', Global.parties.get(partyId)?.players.map(player =>
		{
			return {
				id: player.id,
				image: player.image
			};
		}));
	});

	socket.on('disconnect', () =>
	{
		let party: Party | null = null;

		for (let p of Global.parties.values())
			if (p.has(socket.id))
			{
				party = p;
				break;
			}

		if (party == null)
		{
			console.log(`Player ${socket.id} disconnected`);
			return;
		}

		console.log(`Player ${socket.id} disconnected and left party ${party.id}`);
		Global.io.to(party.id).emit('removePlayer', socket.id);
		party.removePlayer(socket.id);
	});
}
