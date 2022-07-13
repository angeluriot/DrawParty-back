export default class Point {
	x: number;
	y: number;

	constructor(x = 0, y = 0) {
		this.x = x;
		this.y = y;
	}

	distanceSquared(other: Point) : number {
		const dx = this.x - other.x;
		const dy = this.y - other.y;
		return dx * dx + dy * dy;
	}

	distance(other: Point) : number {
		const dx = this.x - other.x;
		const dy = this.y - other.y;
		return Math.sqrt(dx * dx + dy * dy);
	}

	isInRect(width: number, height: number): boolean {
		return this.x >= 0 && this.y >= 0 && this.x < width && this.y < height;
	}
}
