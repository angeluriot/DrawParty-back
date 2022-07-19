export class Player
{
	id: string;
	image: string;
	score: number = 0;

	constructor(id: string, image: string)
	{
		this.id = id;
		this.image = image;
	}
};
