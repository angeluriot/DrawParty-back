import Player from './Player.js';
import Minigame from './minigames/Minigame.js';
import Global from './Global.js';

export default class Party
{
	id: string;
	players: Player[] = [];
	minigame: Minigame | null = null;
	started = false;
	ended = false;
	deleted = false;
	round = 0;
	roundNb = 5;
	minigamesEnabled = Global.minigames.map(minigame => true);
	minigamesTypesEnabled = Global.minigames.map(minigame => minigame.types.map(type => true));
	minigamesDone = Global.minigames.map(minigame => 0);
	minigamesTypesDone = Global.minigames.map(minigame => minigame.types.map(type => 0));

	constructor(id: string, leader: Player)
	{
		this.id = id;
		this.players.push(leader);
	}

	has(playerId: string)
	{
		return this.players.some(player => player.socket.id === playerId);
	}

	getPlayer(id: string)
	{
		return this.players.find(player => player.socket.id === id);
	}

	isLeader(id: string)
	{
		if (this.players.length === 0)
			return false;

		return this.players[0].socket.id === id;
	}

	getConstraints()
	{
		let minPlayers = 100;
		let even = true;

		for (let i = 0; i < Global.minigames.length; i++)
		{
			let minigame = Global.minigames[i];

			if (this.minigamesEnabled[i])
			{
				if (minigame.minPlayers)
				{
					if (minPlayers > minigame.minPlayers)
						minPlayers = minigame.minPlayers;

					if (!minigame.even)
						even = false;
				}

				for (let j = 0; j < Global.minigames[i].types.length; j++)
				{
					let type = minigame.types[j];

					if (this.minigamesTypesEnabled[i][j])
					{
						if (minPlayers > type.minPlayers)
							minPlayers = type.minPlayers;

						if (!type.even)
							even = false;
					}
				}
			}
		}

		return {
			minPlayers: minPlayers,
			maxPlayers: 20,
			even: even
		}
	}

	checkConstraints()
	{
		let constraints = this.getConstraints();

		return this.players.length >= constraints.minPlayers && this.players.length <= constraints.maxPlayers &&
			(constraints.even ? this.players.length % 2 === 0 : true);
	}

	full()
	{
		return this.players.length == this.getConstraints().maxPlayers;
	}

	removePlayer(id: string)
	{
		if (this.deleted)
			return;

		this.players = this.players.filter(player => player.socket.id != id);

		if ((this.started && !this.checkConstraints()) || this.players.length === 0)
		{
			this.deleteParty();
			return;
		}

		let socket = Global.io.sockets.sockets.get(id);

		if (socket)
			socket.leave(this.id);

		if (!this.started)
			this.players[0].socket.emit('updateStart', this.checkConstraints());

		Global.io.to(this.id).emit('removePlayer', id);

		if (this.minigame)
			this.minigame.removePlayer(id);
	}

	deleteParty()
	{
		if (this.deleted)
			return;

		this.deleted = true;

		for (let player of this.players)
			player.socket.disconnect();

		Global.parties.delete(this.id);
		console.log(`Party ${this.id} deleted`);
	}

	chooseNextMinigame()
	{
		let minigameId = 0;
		let typeId = 0;

		this.minigamesDone[minigameId]++;
		this.minigamesTypesDone[minigameId][typeId]++;

		return Global.minigames[minigameId].create(this, Global.minigames[minigameId].types[typeId].name);
	}

	start()
	{
		if (this.deleted)
			return;

		this.started = true;
		Global.io.to(this.id).emit('partyStarted');
		setTimeout(() => this.nextRound(), 4500);
		console.log(`Party ${this.id} started`);
	}

	nextRound()
	{
		if (this.deleted)
			return;

		this.round++;

		if (this.round > this.roundNb)
		{
			this.end();
			return;
		}

		this.minigame = this.chooseNextMinigame();
		this.minigame.init();
		Global.io.to(this.id).emit('nextRound', this.minigame.name, this.minigame.type);
		console.log(`Party ${this.id} round ${this.round} started`);
	}

	end()
	{
		if (this.deleted)
			return;

		this.ended = true;
		let timeout: NodeJS.Timeout;

		for (let player of this.players)
		{
			player.socket.on('resetParty', () =>
			{
				if (this.isLeader(player.socket.id))
				{
					for (let player of this.players)
						player.socket.removeAllListeners('resetParty');

					clearTimeout(timeout);
					this.reset();
				}
			});
		}

		// TODO: calculate final scores
		Global.io.to(this.id).emit('partyEnded');
		timeout = setTimeout(() => this.deleteParty(), 300000);
		console.log(`Party ${this.id} ended`);
	}

	reset()
	{
		if (this.deleted)
			return;

		this.minigame = null;
		this.started = false;
		this.ended = false;
		this.round = 0;
		this.minigamesDone = Global.minigames.map(minigame => 0);
		this.minigamesTypesDone = Global.minigames.map(minigame => minigame.types.map(type => 0));
		Global.io.to(this.id).emit('partyReset');
	}
}
