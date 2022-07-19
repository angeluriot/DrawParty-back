import { Party } from './Party.js';
import { Server } from 'socket.io';

export class Global
{
	static io: Server;
	static parties = new Map<string, Party>();
	static minPartySize = 3;
	static maxPartySize = 30;
}
