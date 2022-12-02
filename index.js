"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const tempMatavimai = require('./data/matavimai.json');
const tempStiprumas = require('./data/stiprumai.json');
const tempVartotojai = require('./data/vartotojai.json');
const stiprumai = tempStiprumas;
const vartotojai = tempVartotojai;
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - ${req.ip}`);
    next();
});
const port = process.env.PORT || 3000;
const WILI_BOX_1 = 'wiliboxas1';
const WILI_BOX_2 = 'wiliboxas2';
const WILI_BOX_3 = 'wiliboxas3';
const users = [];
let macAddresses = vartotojai.map((vartotojas) => vartotojas.mac);
macAddresses = macAddresses.filter((mac, index) => macAddresses.indexOf(mac) === index);
macAddresses.forEach((mac) => {
    const user = {
        mac: mac,
        stiprumai: [],
    };
    vartotojai
        .filter((vartotojas) => vartotojas.mac === mac)
        .forEach((vartotojas) => {
        const stiprumas = {
            sensorius: vartotojas.sensorius,
            stiprumas: vartotojas.stiprumas,
        };
        user.stiprumai.push(stiprumas);
    });
    users.push(user);
});
// console.table(users.map((user: User) => user.stiprumai));
const matavimai = tempMatavimai.map((m) => {
    return {
        matavimas: m.matavimas,
        x: m.x,
        y: m.y,
        atstumas: m.atstumas,
        stiprumai: stiprumai.filter((s) => s.matavimas === m.matavimas),
    };
});
let maxY = matavimai.reduce((max, p) => (p.y > max ? p.y : max), matavimai[0].y);
let maxX = matavimai.reduce((max, p) => (p.x > max ? p.x : max), matavimai[0].x);
let minY = matavimai.reduce((min, p) => (p.y < min ? p.y : min), matavimai[0].y);
let minX = matavimai.reduce((min, p) => (p.x < min ? p.x : min), matavimai[0].x);
// correct min and max values to start from 0
maxY -= minY;
maxX -= minX;
matavimai.forEach((p) => {
    p.x -= minX;
    p.y -= minY;
});
// create a 2D array of zeros
let grid = [];
for (let y = 0; y <= maxY; y++) {
    grid[y] = [];
    for (let x = 0; x <= maxX; x++) {
        if (matavimai.find((p) => p.x === x && p.y === y)) {
            grid[y][x] = 1;
        }
        else {
            grid[y][x] = 0;
        }
    }
}
grid.forEach((row) => {
    console.log(row.join(''));
});
app.get('/', (req, res) => {
    let string = '';
    grid.forEach((row) => {
        string += row.join('') + '\n';
    });
    res.send({ map: string });
});
app.post('/', (req, res) => {
    var _a;
    const messages = [];
    const data = [];
    const userList = ((_a = req.body) === null || _a === void 0 ? void 0 : _a.users) || users;
    try {
        userList.forEach((user) => {
            var _a, _b, _c;
            const rss1 = (_a = user.stiprumai.find((s) => s.sensorius === WILI_BOX_1)) === null || _a === void 0 ? void 0 : _a.stiprumas;
            const rss2 = (_b = user.stiprumai.find((s) => s.sensorius === WILI_BOX_2)) === null || _b === void 0 ? void 0 : _b.stiprumas;
            const rss3 = (_c = user.stiprumai.find((s) => s.sensorius === WILI_BOX_3)) === null || _c === void 0 ? void 0 : _c.stiprumas;
            var indexOfMatavimas = 0;
            var minDistance = Number.MAX_VALUE;
            matavimai.forEach((matavimas, index) => {
                var _a, _b, _c, _d, _e, _f;
                const rss1m = (_b = (_a = matavimas.stiprumai) === null || _a === void 0 ? void 0 : _a.find((s) => s.sensorius === WILI_BOX_1)) === null || _b === void 0 ? void 0 : _b.stiprumas;
                const rss2m = (_d = (_c = matavimas.stiprumai) === null || _c === void 0 ? void 0 : _c.find((s) => s.sensorius === WILI_BOX_2)) === null || _d === void 0 ? void 0 : _d.stiprumas;
                const rss3m = (_f = (_e = matavimas.stiprumai) === null || _e === void 0 ? void 0 : _e.find((s) => s.sensorius === WILI_BOX_3)) === null || _f === void 0 ? void 0 : _f.stiprumas;
                if (rss1 === undefined ||
                    rss2 === undefined ||
                    rss3 === undefined ||
                    rss1m === undefined ||
                    rss2m === undefined ||
                    rss3m === undefined) {
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
            messages.push(`User ${user.mac} is at x: ${matavimas.x}, y: ${matavimas.y}, distance: ${minDistance}`);
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
    }
    catch (error) {
        res.status(400).send({
            message: "Provided format of the array isn't correct",
        });
    }
});
app.get('/signals', (req, res) => {
    res.json({ signals: matavimai });
});
app.post('/signals', (req, res) => {
    const matavimas = req.body;
    matavimai.push(matavimas);
    res.json({ signals: matavimai });
});
app.delete('/signals/:id', (req, res) => {
    const id = Number(req.params.id);
    const matavimas = matavimai.find((m) => m.matavimas === id);
    if (matavimas) {
        matavimai.splice(matavimai.indexOf(matavimas), 1);
        res.json({ signals: matavimai });
    }
    else {
        res.status(404).end();
    }
});
app.listen(port, () => {
    console.log(`Timezones by location application is running on port ${port}.`);
});
