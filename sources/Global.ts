import { Party } from './Party.js';
import { Server } from 'socket.io';
import { DrawBattle } from './minigames/DrawBattle.js';

export class Global
{
	static io: Server;
	static parties = new Map<string, Party>();
	static minigames = [
		{
			name: 'draw-battle',
			create: (party: Party, type: string) => new DrawBattle(party, type),
			minPlayers: null,
			even: null,
			types: [
				{ name: 'solo', minPlayers: 3, even: false },
				{ name: 'duo', minPlayers: 6, even: true },
				{ name: 'pixel-art', minPlayers: 3, even: false },
				{ name: 'speed', minPlayers: 3, even: false },
				{ name: 'duo-speed', minPlayers: 6, even: true },
				{ name: 'pixel-art-speed', minPlayers: 3, even: false }
			]
		},
		{
			name: 'draw-guesser',
			create: (party: Party, type: string) => new DrawBattle(party, type),
			minPlayers: null,
			even: null,
			types: [
				{ name: 'solo', minPlayers: 3, even: false },
				{ name: 'duo', minPlayers: 4, even: false },
				{ name: 'mcq', minPlayers: 3, even: false }
			],
		},
		{
			name: 'filling-fight',
			create: (party: Party, type: string) => new DrawBattle(party, type),
			minPlayers: 2,
			even: false,
			types: []
		},
		{
			name: 'best-copier',
			create: (party: Party, type: string) => new DrawBattle(party, type),
			minPlayers: 2,
			even: false,
			types: []
		},
		{
			name: 'fastest-copier',
			create: (party: Party, type: string) => new DrawBattle(party, type),
			minPlayers: 2,
			even: false,
			types: []
		},
		{
			name: 'memory-draw',
			create: (party: Party, type: string) => new DrawBattle(party, type),
			minPlayers: 2,
			even: false,
			types: []
		},
		{
			name: 'perfect-coloring',
			create: (party: Party, type: string) => new DrawBattle(party, type),
			minPlayers: 2,
			even: false,
			types: []
		}
	];
}
