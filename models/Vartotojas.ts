import { Model } from "sequelize";
import { DataTypes } from "sequelize";
import { sequelize } from "../index";

export class Vartotojas extends Model {
  id: number;
  mac: string;
  sensorius: string;
  stiprumas: number;
}
Vartotojas.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    mac: DataTypes.STRING,
    sensorius: DataTypes.STRING,
    stiprumas: DataTypes.FLOAT,
  },
  { sequelize, modelName: "vartotojai" }
);
