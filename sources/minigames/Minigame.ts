import Global from '../Global.js';
import Party from '../Party.js';

export default class Minigame
{
	party: Party;
	name = '';
	type: string | null;
	teams: string[][];
	playersRank: string[];
	playersScore = new Map<string, number>();
	stop = false;
	ended = false;

	constructor(party: Party, type: string | null)
	{
		this.party = party;
		this.type = type;
		this.playersRank = party.players.map(player => player.socket.id);

		for (let player of this.party.players)
			this.playersScore.set(player.socket.id, 0);

		this.teams = this.createTeams();
	}

	check()
	{
		let minigame = Global.minigames.find(minigame => minigame.name === this.name);

		if (!minigame)
			return false;

		if (this.type == '')
		{
			if (!minigame.minPlayers)
				return false;

			return this.party.players.length >= minigame.minPlayers && !(minigame.even && this.party.players.length % 2 != 0);
		}

		let type = minigame.types.find(type => type.name === this.type);

		if (!type)
			return false;

		return this.party.players.length >= type.minPlayers && !(type.even && this.party.players.length % 2 != 0);
	}

	createTeams()
	{
		return [this.party.players.map(player => player.socket.id)];
	}

	removePlayer(playerId: string)
	{
		this.playersRank = this.playersRank.filter(id => id !== playerId);
		this.playersScore.delete(playerId);

		if (!this.check())
		{
			this.stop = true;
			this.end();
		}
	}

	init() {}
	start() {}
	end() {}
}
