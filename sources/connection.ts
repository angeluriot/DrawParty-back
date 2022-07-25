import { Socket } from 'socket.io';
import Global from './Global.js';
import Party from './Party.js';
import Player from './Player.js';
import * as Utils from './utils.js';

function checkParty(socket: Socket, partyId: string)
{
	let party = Global.parties.get(partyId);
	return !Utils.getPartyId(socket) && party && !party.started && !party.full();
}

export function connectionEvents(socket: Socket)
{
	console.log(`Player ${socket.id} connected`);

	socket.on('createParty', (image: any) =>
	{
		if (!Utils.is(image, 'string') || Utils.getPartyId(socket))
		{
			socket.disconnect();
			return;
		}

		let partyId = Utils.createPartyId();
		let player = new Player(socket, image);
		Global.parties.set(partyId, new Party(partyId, player));
		socket.join(partyId);
		socket.emit('partyCreated', partyId);
		console.log(`Party ${partyId} created by ${socket.id}`);
	});

	socket.on('get-home', (partyId: any) =>
	{
		if (!Utils.is(partyId, 'string') || !checkParty(socket, partyId))
			socket.disconnect();

		socket.emit('res-home');
	});

	socket.on('joinParty', (partyId: any, image: any) =>
	{
		if (!Utils.is(partyId, 'string') || !Utils.is(image, 'string') || !checkParty(socket, partyId))
		{
			socket.disconnect();
			return;
		}

		let player = new Player(socket, image);
		let party = Global.parties.get(partyId) as Party;
		party.players.push(player);
		socket.join(partyId);
		socket.emit('partyJoined');
		socket.to(partyId).emit('newPlayer', { id: socket.id, image: image });
		party.players[0].socket.emit('updateStart', party.checkConstraints());
		console.log(`${socket.id} joined party ${partyId}`);
	});

	socket.on('get-party', () =>
	{
		let party = Utils.getParty(socket);

		if (!party || party.started)
		{
			socket.disconnect();
			return;
		}

		socket.emit('res-party', party.players.map(player =>
		{
			return {
				id: player.socket.id,
				image: player.image
			};
		}), {
			roundNb: party.roundNb,
			minigamesEnabled: party.minigamesEnabled,
			minigamesTypesEnabled: party.minigamesTypesEnabled
		});
	});

	socket.on('setRoundNb', (roundNb: any) =>
	{
		let party = Utils.getParty(socket);

		if (!party || party.started || !party.isLeader(socket.id) || !Utils.isInt(roundNb, 1, 30))
		{
			socket.disconnect();
			return;
		}

		party.roundNb = roundNb;
		socket.to(party.id).emit('getRoundNb', roundNb);
	});

	socket.on('setMinigameEnabled', (id: any, checked: any) =>
	{
		let party = Utils.getParty(socket);

		if (!party || party.started || !party.isLeader(socket.id) || !Utils.isIndex(id, Global.minigames) || !Utils.is(checked, 'boolean'))
		{
			socket.disconnect();
			return;
		}

		party.minigamesEnabled[id] = checked;
		socket.emit('updateStart', party.checkConstraints());
		socket.to(party.id).emit('getMinigameEnabled', id, checked);
	});

	socket.on('setMinigameTypeEnabled', (id: any, i: any, checked: any) =>
	{
		let party = Utils.getParty(socket);

		if (!party || party.started || !party.isLeader(socket.id) || !Utils.isIndex(id, Global.minigames) ||
			!Utils.isIndex(i, Global.minigames[id].types) || !Utils.is(checked, 'boolean'))
		{
			socket.disconnect();
			return;
		}

		party.minigamesTypesEnabled[id][i] = checked;
		socket.emit('updateStart', party.checkConstraints());
		socket.to(party.id).emit('getMinigameTypeEnabled', id, i, checked);
	});

	socket.on('startParty', () =>
	{
		let party = Utils.getParty(socket);

		if (!party || party.started || !party.isLeader(socket.id) || !party.checkConstraints())
		{
			socket.disconnect();
			return;
		}

		party.start();
	});

	socket.on('disconnect', () =>
	{
		for (let party of Global.parties.values())
			if (party.has(socket.id))
			{
				console.log(`Player ${socket.id} disconnected and left party ${party.id}`);
				party.removePlayer(socket.id);
				return;
			}

		console.log(`Player ${socket.id} disconnected`);
	});
}
