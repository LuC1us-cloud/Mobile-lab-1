interface Matavimas {
	matavimas: number;
	x: number;
	y: number;
	atstumas: number;
	stiprumai?: Stiprumas[];
}

interface Stiprumas {
	id?: number;
	matavimas?: number;
	sensorius: string;
	stiprumas: number;
}

interface Vartotojas {
	id: number;
	mac: string;
	sensorius: string;
	stiprumas: number;
}

interface User {
	mac: string;
	stiprumai: Stiprumas[];
}

import express from 'express';
const tempMatavimai = require('./data/matavimai.json');
const tempStiprumas = require('./data/stiprumai.json');
const tempVartotojai = require('./data/vartotojai.json');
const stiprumai = tempStiprumas as Stiprumas[];
const vartotojai = tempVartotojai as Vartotojas[];

const app = express();
app.use(express.json());

app.use((req, res, next) => {
	console.log(`${req.method} ${req.path} - ${req.ip}`);
	next();
});

const port = process.env.PORT || 3000;
const WILI_BOX_1 = 'wiliboxas1';
const WILI_BOX_2 = 'wiliboxas2';
const WILI_BOX_3 = 'wiliboxas3';

const users: User[] = [];
let macAddresses: string[] = vartotojai.map(
	(vartotojas: Vartotojas) => vartotojas.mac
);
macAddresses = macAddresses.filter(
	(mac: string, index: number) => macAddresses.indexOf(mac) === index
);

macAddresses.forEach((mac: string) => {
	const user: User = {
		mac: mac,
		stiprumai: [],
	};
	vartotojai
		.filter((vartotojas: Vartotojas) => vartotojas.mac === mac)
		.forEach((vartotojas: Vartotojas) => {
			const stiprumas: Stiprumas = {
				sensorius: vartotojas.sensorius,
				stiprumas: vartotojas.stiprumas,
			};
			user.stiprumai.push(stiprumas);
		});

	users.push(user);
});

// console.table(users.map((user: User) => user.stiprumai));

const matavimai: Matavimas[] = tempMatavimai.map((m: any): Matavimas => {
	return {
		matavimas: m.matavimas,
		x: m.x,
		y: m.y,
		atstumas: m.atstumas,
		stiprumai: stiprumai.filter(
			(s: Stiprumas) => s.matavimas === m.matavimas
		),
	};
});

let maxY = matavimai.reduce(
	(max: number, p: { y: number }) => (p.y > max ? p.y : max),
	matavimai[0].y
);
let maxX = matavimai.reduce(
	(max: number, p: { x: number }) => (p.x > max ? p.x : max),
	matavimai[0].x
);
let minY = matavimai.reduce(
	(min: number, p: { y: number }) => (p.y < min ? p.y : min),
	matavimai[0].y
);
let minX = matavimai.reduce(
	(min: number, p: { x: number }) => (p.x < min ? p.x : min),
	matavimai[0].x
);
// correct min and max values to start from 0
maxY -= minY;
maxX -= minX;
matavimai.forEach((p: { x: number; y: number }) => {
	p.x -= minX;
	p.y -= minY;
});

// create a 2D array of zeros
let grid: number[][] = [];
for (let y = 0; y <= maxY; y++) {
	grid[y] = [];
	for (let x = 0; x <= maxX; x++) {
		if (
			matavimai.find((p: { x: number; y: number }) => p.x === x && p.y === y)
		) {
			grid[y][x] = 1;
		} else {
			grid[y][x] = 0;
		}
	}
}

grid.forEach((row: number[]) => {
	console.log(row.join(''));
});

app.get('/', (req, res) => {
	let string = '';
	grid.forEach((row: number[]) => {
		string += row.join('') + '\n';
	});
	res.send({ map: string });
});

app.post('/', (req, res) => {
	const messages: string[] = [];
	const data: any[] = [];

	const userList = req.body?.users || users;

	try {
		userList.forEach((user: User) => {
			const rss1 = user.stiprumai.find(
				(s: Stiprumas) => s.sensorius === WILI_BOX_1
			)?.stiprumas;
			const rss2 = user.stiprumai.find(
				(s: Stiprumas) => s.sensorius === WILI_BOX_2
			)?.stiprumas;
			const rss3 = user.stiprumai.find(
				(s: Stiprumas) => s.sensorius === WILI_BOX_3
			)?.stiprumas;

			var indexOfMatavimas = 0;
			var minDistance = Number.MAX_VALUE;

			matavimai.forEach((matavimas: Matavimas, index: number) => {
				const rss1m = matavimas.stiprumai?.find(
					(s: Stiprumas) => s.sensorius === WILI_BOX_1
				)?.stiprumas;
				const rss2m = matavimas.stiprumai?.find(
					(s: Stiprumas) => s.sensorius === WILI_BOX_2
				)?.stiprumas;
				const rss3m = matavimas.stiprumai?.find(
					(s: Stiprumas) => s.sensorius === WILI_BOX_3
				)?.stiprumas;

				if (
					rss1 === undefined ||
					rss2 === undefined ||
					rss3 === undefined ||
					rss1m === undefined ||
					rss2m === undefined ||
					rss3m === undefined
				) {
					return;
				}

				let rss1sq = Math.pow(rss1 - rss1m, 2);
				let rss2sq = Math.pow(rss2 - rss2m, 2);
				let rss3sq = Math.pow(rss3 - rss3m, 2);

				let rssSum = rss1sq + rss2sq + rss3sq;
				let distance = Math.sqrt(rssSum);

				if (distance < minDistance) {
					minDistance = distance;
					indexOfMatavimas = index;
				}
			});

			const matavimas = matavimai[indexOfMatavimas];

			messages.push(
				`User ${user.mac} is at x: ${matavimas.x}, y: ${matavimas.y}, distance: ${minDistance}`
			);
			data.push({
				mac: user.mac,
				x: matavimas.x,
				y: matavimas.y,
				distance: minDistance,
			});
		});
		res.send({
			responses: messages,
			responseData: data,
		});
	} catch (error) {
		res.status(400).send({
			message: "Provided format of the array isn't correct",
		});
	}
});

app.get('/signals', (req, res) => {
	res.json({ signals: matavimai });
});

app.post('/signals', (req, res) => {
	const matavimas: Matavimas = req.body;
	matavimai.push(matavimas);
	res.json({ signals: matavimai });
});

app.delete('/signals/:id', (req, res) => {
	const id = Number(req.params.id);
	const matavimas = matavimai.find((m: Matavimas) => m.matavimas === id);
	if (matavimas) {
		matavimai.splice(matavimai.indexOf(matavimas), 1);
		res.json({ signals: matavimai });
	} else {
		res.status(404).end();
	}
});

app.listen(port, () => {
	console.log(`Timezones by location application is running on port ${port}.`);
});
