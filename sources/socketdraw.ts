import { Socket } from 'socket.io';
import Point from './Point.js';
import Global from './Global.js';
import * as Utils from './utils.js';

class ActionValidator {
	// Checks if the action is a valid brush action (1 <= brushSize <= 30, color = #xxxxxx, point is in canvas, layer = 0 | 1, eraser is a bool)
	static validateCreateBrush(data: any): boolean {
		if (!data.color || !/^#[a-fA-F0-9]{6}$/.test(data.color))
			return false;
		if (!Utils.is(data.size, 'number') || data.size < 0.002 || data.size > 0.05)
			return false;
		if (!data.point || !Number.isFinite(data.point.x) || !Number.isFinite(data.point.y) || !new Point(data.point.x, data.point.y).isInRect(1, 1))
			return false;
		if (typeof(data.eraser) !== 'boolean')
			return false;
		if (!Number.isSafeInteger(data.layer) || data.layer < 0 || data.layer > 1)
			return false;
		return true;
	}

	// Checks if the action is a valid update brush action (point is in canvas)
	static validateUpdateBrush(data: any): boolean {
		if (!data.point || !Number.isFinite(data.point.x) || !Number.isFinite(data.point.y) || !new Point(data.point.x, data.point.y).isInRect(1, 1))
			return false;
		return true;
	}

	// Checks if the action is a valid fill action (color = #xxxxxx, point is in canvas, layer = 0 | 1)
	static validateFill(data: any): boolean {
		if (!data.color || !/^#[a-fA-F0-9]{6}$/.test(data.color))
			return false;
		if (!data.point || !Number.isFinite(data.point.x) || !Number.isFinite(data.point.y) || !new Point(data.point.x, data.point.y).isInRect(1, 1))
			return false;
		if (!Number.isSafeInteger(data.layer) || data.layer < 0 || data.layer > 1)
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
		if (!ActionValidator.validateCreateBrush(action))
			return;
		console.log(action);
		this.actionHistory.push(new ActionIdentifier(socket.id, 'createBrush', {layer: action.layer, color: action.color, size: action.size, point: action.point, eraser: action.eraser}));
	}

	fill(socket: Socket, action: any): void {
		if (!ActionValidator.validateFill(action))
			return;
		this.actionHistory.push(new ActionIdentifier(socket.id, 'fill', {layer: action.layer, color: action.color, point: action.point}));
	}

	updateBrush(socket: Socket, action: any): void {
		if (!ActionValidator.validateUpdateBrush(action))
			return;
		const point = new Point(action.point.x, action.point.y);
		this.actionHistory.push(new ActionIdentifier(socket.id, 'updateBrush', point));
	}

	clear(socket: Socket, action: any): void {
		this.actionHistory.push(new ActionIdentifier(socket.id, 'clear', {}));
	}

	undo(socket: Socket) {
		this.actionHistory.push(new ActionIdentifier(socket.id, 'undo', { requestedBy: socket.id }));
	}

	redo(socket: Socket) {
		this.actionHistory.push(new ActionIdentifier(socket.id, 'redo', { requestedBy: socket.id }));
	}

	init(socket: Socket) {
		socket.on('clientUpdate', (data: any) => {
			if (!data || !Array.isArray(data) || data.length > 50)
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
					this.undo(socket);
				else if (action.type == 'redo')
					this.redo(socket);
				// TODO: check if the game is a single-drawer game
				else if (action.type == 'fill')
					this.fill(socket, action);
			}
		})
	}

	// Called once per frame, sends the actions that weren't already sent to the clients
	update() {
		if (this.actionsSent >= this.actionHistory.length)
			return;
		Global.io.emit('serverUpdate', this.actionHistory.slice(this.actionsSent));
		this.actionsSent = this.actionHistory.length;
	}
}
