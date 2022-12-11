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

import express from "express";
import { DataTypes, Sequelize } from "sequelize";
//import * as mysql2 from "mysql2";

const port = process.env.PORT || 3000;
const app = express();
app.use(express.json());

let tempStiprumasArray: any[] = [];
let tempVartotojaiArray: any[] = [];
let tempMatavimaiArray: any[] = [];
const users: User[] = [];
let matavimai: Matavimas[] = [];
let grid: number[][] = [];

app.listen(port, async () => {
  console.log(`Timezones by location application is running on port ${port}.`);
  tempStiprumasArray = await tempStiprumas.findAll();
  tempMatavimaiArray = await tempMatavimai.findAll();
  tempVartotojaiArray = await tempVartotojai.findAll();

  const stiprumai = tempStiprumasArray as Stiprumas[];
  const vartotojai = tempVartotojaiArray as Vartotojas[];

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

  matavimai = tempMatavimaiArray.map((m: any): Matavimas => {
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
    console.log(row.join(""));
  });
});

export const sequelize = new Sequelize("LDB", "stud", "vLXCDmSG6EpEnhXX", {
  host: "seklys.ila.lt",
  port: 3306,
  dialect: "mysql",
});

const tempStiprumas = sequelize.define(
  "stiprumai",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    matavimas: DataTypes.INTEGER,
    sensorius: DataTypes.STRING,
    stiprumas: DataTypes.FLOAT,
  },
  {
    timestamps: false,
    freezeTableName: true,
    tableName: "stiprumai",
  }
);

const tempMatavimai = sequelize.define(
  "matavimai",
  {
    matavimas: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    x: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    y: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    atstumas: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
  },
  {
    timestamps: false,
    freezeTableName: true,
    tableName: "matavimai",
  }
);

const tempVartotojai = sequelize.define(
  "vartotojai",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    mac: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sensorius: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    stiprumas: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
  },
  {
    timestamps: false,
    freezeTableName: true,
    tableName: "vartotojai",
  }
);

//const tempMatavimai = require("./data/matavimai.json");
//const tempStiprumas = require("./data/stiprumai.json");
//const tempVartotojai = require("./data/vartotojai.json");

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

const WILI_BOX_1 = "wiliboxas1";
const WILI_BOX_2 = "wiliboxas2";
const WILI_BOX_3 = "wiliboxas3";

app.get("/", (req, res) => {
  let string = "";
  grid.forEach((row: number[]) => {
    string += row.join("") + "\n";
  });
  res.send({ map: string });
});

app.post("/", (req, res) => {
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

app.get("/signals", (req, res) => {
  res.json({ signals: matavimai });
});

app.post("/signals", (req, res) => {
  const matavimas: Matavimas = req.body;
  matavimai.push(matavimas);
  res.json({ signals: matavimai });
});

app.delete("/signals/:id", (req, res) => {
  const id = Number(req.params.id);
  const matavimas = matavimai.find((m: Matavimas) => m.matavimas === id);
  if (matavimas) {
    matavimai.splice(matavimai.indexOf(matavimas), 1);
    res.json({ signals: matavimai });
  } else {
    res.status(404).end();
  }
});
