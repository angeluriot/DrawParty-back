import { Minigame } from "./Minigame.js";
import { Party } from '../Party.js';
import { Global } from "../Global.js";

export class DrawBattle extends Minigame
{
	constructor(party: Party, type: string)
	{
		super(party, type);
		this.name = 'draw-battle';
	}

	createTeams()
	{
		return [this.party.players.map(player => player.socket.id)];
	}

	removePlayer(playerId: string)
	{
		super.removePlayer(playerId);
	}

	init()
	{
		if (this.party.deleted || this.stop)
			return;

		for (let player of this.party.players)
		{
			player.socket.on('get-minigame', (minigame: any, type: any) =>
			{
				if (!(minigame === this.name && type === this.type))
				{
					player.socket.disconnect();
					return;
				}

				player.socket.emit('res-minigame', this.party.round, this.teams);
			});
		}

		setTimeout(() => this.start(), 8000);
	}

	start()
	{
		if (this.party.deleted || this.stop)
			return;

		for (let player of this.party.players)
			player.socket.removeAllListeners('get-minigame');

		// TODO: Socket on
		Global.io.to(this.party.id).emit('minigameStart');
		// TODO: Server side of the minigame
		setTimeout(() => this.end(), 10000);
	}

	end()
	{
		if (this.party.deleted || this.ended)
			return;

		this.ended = true;

		// TODO: Socket off
		// TODO: calculate scores

		let scores = [];

		for (const [id, score] of this.playersScore.entries())
			scores.push({ id: id, score: score });

		Global.io.to(this.party.id).emit('minigameScores', scores);
		setTimeout(() => this.party.nextRound(), 5000);
	}
}
