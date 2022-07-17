import { User } from './User.js';
import { MiniGame } from './miniGames/MiniGame.js';

export class Game
{
	users: User[] = [];
	miniGames: MiniGame[] = [];
	started = false;
	round = 0;
}
