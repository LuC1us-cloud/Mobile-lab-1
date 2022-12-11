import { Model } from "sequelize";
import { DataTypes } from "sequelize";
import { sequelize } from "../index";

export class Stiprumas extends Model {
  id?: number;
  matavimas?: number;
  sensorius: string;
  stiprumas: number;
}
Stiprumas.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    matavimas: DataTypes.INTEGER,
    sensorius: DataTypes.STRING,
    stiprumas: DataTypes.FLOAT,
  },
  { sequelize, modelName: "stiprumai" }
);
