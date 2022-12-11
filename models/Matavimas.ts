import { Model } from "sequelize";
import { DataTypes } from "sequelize";
import { sequelize } from "../index";

export class Matavimas extends Model {
  matavimas?: number;
  x: number;
  y: number;
  atstumas: number;
}
Matavimas.init(
  {
    matavimas: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    x: DataTypes.INTEGER,
    y: DataTypes.INTEGER,
    atstumas: DataTypes.FLOAT,
  },
  { sequelize, modelName: "matavimai" }
);
