import { Player } from './Player.js';
import { MiniGame } from './miniGames/MiniGame.js';
import { Global } from './Global.js';

export class Party
{
	id: string;
	players: Player[] = [];
	miniGames: MiniGame[] = [];
	started = false;
	round = 0;
	maxRounds: number = 5;

	constructor(id: string, leader: Player)
	{
		this.id = id;
		this.players.push(leader);
	}

	full()
	{
		return this.players.length >= Global.maxPartySize;
	}

	has(playerId: string)
	{
		return this.players.some(player => player.id === playerId);
	}

	getPlayer(id: string)
	{
		let player = this.players.find(player => player.id === id);

		if (player == undefined)
			return null;

		return player;
	}

	removePlayer(id: string)
	{
		this.players = this.players.filter(player => player.id !== id);

		if ((this.started && this.players.length < Global.minPartySize) || this.players.length === 0)
			this.deleteParty();
	}

	deleteParty()
	{
		for (let player of this.players)
		{
			let socket = Global.io.sockets.sockets.get(player.id);

			if (socket != undefined)
			{
				socket.emit('error');
				socket.leave(this.id);
			}
		}

		Global.parties.delete(this.id);
		console.log(`Party ${this.id} deleted`);
	}
}
