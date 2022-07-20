import { Server, Socket } from 'socket.io';
import Point from './Point.js';

class AddBrushActionValidator {
	// Checks if the action is a valid brush action (1 <= brushSize <= 30, color = #xxxxxx, point is in canvas, layer = 0 | 1, eraser is a bool)
	static validate(data: any): boolean {
		if (!data.color || !/^#[a-fA-F0-9]{6}$/.test(data.color))
			return false;
		if (!Number.isSafeInteger(data.size) || data.size < 1 || data.size > 30)
			return false;
		if (!data.point || !Number.isFinite(data.point.x) || !Number.isFinite(data.point.y) || !new Point(data.point.x, data.point.y).isInRect(1, 1))
			return false;
		if (typeof(data.eraser) !== 'boolean')
			return false;
		if (!Number.isSafeInteger(data.layer) || data.layer < 0 || data.layer > 1)
			return false;
		return true;
	}
}

class UpdateBrushActionValidator {
	static validate(data: any): boolean {
		if (!data.point || !Number.isFinite(data.point.x) || !Number.isFinite(data.point.y) || !new Point(data.point.x, data.point.y).isInRect(1, 1))
			return false;
		return true;
	}
}

class ActionIdentifier {
	requestedBy: string;
	type: string;
	data: any;

	constructor(requestedBy: string, type: string, data: any) {
		this.requestedBy = requestedBy;
		this.type = type;
		this.data = data;
	}
}

export class DrawTest {
	actionHistory: ActionIdentifier[] = [];
	actionsSent: number = 0;

	createBrush(socket: Socket, action: any): void {
		if (!AddBrushActionValidator.validate(action))
			return;
		this.actionHistory.push(new ActionIdentifier(socket.id, 'createBrush', {layer: action.layer, color: action.color, size: action.size, point: action.point, eraser: action.eraser}));
	}

	updateBrush(socket: Socket, action: any): void {
		if (!UpdateBrushActionValidator.validate(action))
			return;
		const point = new Point(action.point.x, action.point.y);
		this.actionHistory.push(new ActionIdentifier(socket.id, 'updateBrush', point));
	}

	clear(socket: Socket, action: any): void {
		this.actionHistory.push(new ActionIdentifier(socket.id, 'clear', {}));
	}

	undo(socket: Socket, action: any) {
		this.actionHistory.push(new ActionIdentifier(socket.id, 'undo', { requestedBy: socket.id }));
	}

	redo(socket: Socket, action: any) {
		this.actionHistory.push(new ActionIdentifier(socket.id, 'redo', { requestedBy: socket.id }));
	}

	init(io: Server, socket: Socket) {
		socket.on('clientUpdate', (data: any) => {
			if (!data || !Array.isArray(data))
				return;
			for (const action of data) {
				if (!action || !action.type)
					return;
				if (action.type == 'createBrush')
					this.createBrush(socket, action);
				else if (action.type == 'updateBrush')
					this.updateBrush(socket, action);
				else if (action.type == 'clear')
					this.clear(socket, action);
				else if (action.type == 'undo')
					this.undo(socket, action);
				else if (action.type == 'redo')
					this.redo(socket, action);
			}
		})
	}

	// Called once per frame, sends the actions that weren't already sent to the clients
	update(io: Server) {
		if (this.actionsSent >= this.actionHistory.length)
			return;
		io.emit('serverUpdate', this.actionHistory.slice(this.actionsSent));
		this.actionsSent = this.actionHistory.length;
	}
}
