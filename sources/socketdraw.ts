import { Server, Socket } from 'socket.io';
import Point from './Point.js';

const canvasSize = {width: 800, height: 600};

class AddBrushActionDTO {
	color = '';
	size = 0;
	point = new Point();
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
		return true;
	}
}

class UpdateBrushActionDTO {
	points: Point[] = [];
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

export class DrawPlayer {
	actionStack: number[] = [];
	lastBrushPoint?: Point;
}

export class DrawTest {
	readonly drawDistanceThreshold = 4

	players = new Map<string, DrawPlayer>();
	userActionIds = new Map<string, number>();
	totalActions = 0;

	init(io: Server, socket: Socket) {
		this.players.set(socket.id, new DrawPlayer());

		/* Pushes a new Brush Action to the player's stack. It's called once per path created with a brush
		emit to all other clients the created action's id.
		It allows to only store the ids on the server side. So an action is just a number on the server side
		*/
		socket.on('createBrush', (data: any) => {
			if (!data)
				return;
			const player = this.players.get(socket.id);
			if (!AddBrushActionValidator.validate(data) || !player)
				return;
			const action = data as AddBrushActionDTO;
			const actionId = this.totalActions++;
			player.actionStack.push(actionId);
			socket.broadcast.emit('createBrush', { requestedBy: socket.id, action: {...action, id: actionId} });
		});

		// Adds a point to the player's current action. It's called every 10 points placed on the client side
		socket.on('updateBrush', (data: any) => {
			if (!data)
				return;
			const player = this.players.get(socket.id);
			if (!player || !UpdateBrushActionValidator.validate(data))
				return;
			const points = data.points.map((elem: any) => new Point(elem.x, elem.y));
			for (const point of points) {
				if (!point.isInRect(canvasSize.width, canvasSize.height))
					return;
				if (player.lastBrushPoint && player.lastBrushPoint.distanceSquared(point) < this.drawDistanceThreshold)
					return;
				socket.broadcast.emit('updateBrush', {actionId: player.actionStack[player.actionStack.length - 1], point });
				player.lastBrushPoint = point;
			}
		});
	}
}
