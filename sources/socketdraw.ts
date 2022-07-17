import { Server, Socket } from 'socket.io';
import Point from './Point.js';

const canvasSize = {width: 800, height: 600};

class AddBrushActionDTO {
	color = '';
	size = 0;
	point = new Point();
	eraser = false;
	layer = 0;
}

class AddBrushActionValidator {
	// Checks if the action is a valid brush action (1 <= brushSize <= 30, color = #xxxxxx, point is in canvas)
	static validate(data: any): boolean {
		if (!data.color || !/^#[a-fA-F0-9]{6}$/.test(data.color))
			return false;
		if (!data.size || data.size < 1 || data.size > 30)
			return false;
		if (!data.point || !data.point.x || !data.point.y || !new Point(data.point.x, data.point.y).isInRect(canvasSize.width, canvasSize.height))
			return false;
		if (data.eraser == undefined || data.eraser == null)
			return false;
		if (data.layer == undefined || data.layer == null || data.layer < 0 || data.layer > 2)
			return false;
		return true;
	}
}

class UpdateBrushActionValidator {
	// Checks if the action is a valid brush action (1 <= brushSize <= 30, color = #xxxxxx, point is in canvas)
	static validate(data: any): boolean {
		if (!data.points || !Array.isArray(data.points))
			return false;
		if (data.points.length > 10)
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
	// Actions that were sent to the clients
	actionsSent: number = 0;

	init(io: Server, socket: Socket) {
		socket.on('createBrush', (data: any) => {
			if (!data || !AddBrushActionValidator.validate(data))
				return;
			const action = data as AddBrushActionDTO;
			this.actionHistory.push(new ActionIdentifier(socket.id, 'createBrush', action));
			socket.broadcast.emit('createBrush', { requestedBy: socket.id, action });
		});

		socket.on('updateBrush', (data: any) => {
			if (!data || !UpdateBrushActionValidator.validate(data))
				return;
			const points: Point[] = data.points.map((elem: any) => new Point(elem.x, elem.y));
			for (const point of points)
				if (!point.isInRect(canvasSize.width, canvasSize.height))
					return;
			this.actionHistory.push(new ActionIdentifier(socket.id, 'updateBrush', points));
		});

		socket.on('clearActions', () => {
			this.actionHistory.push(new ActionIdentifier(socket.id, 'clearActions', {}));
			socket.broadcast.emit('clearActions', { requestedBy: socket.id });
		});

		// TODO
		socket.on('undo', () => {
			this.actionHistory.push(new ActionIdentifier(socket.id, 'undo', { requestedBy: socket.id }));
		});

		// TODO
		socket.on('redo', () => {
			this.actionHistory.push(new ActionIdentifier(socket.id, 'redo', { requestedBy: socket.id }));
		});
	}

	// Called once per frame, sends the actions that weren't already sent to the clients
	update(io: Server) {
		if (this.actionsSent >= this.actionHistory.length)
			return;
		io.emit('serverUpdate', this.actionHistory.slice(this.actionsSent));
		this.actionsSent = this.actionHistory.length;
	}
}
