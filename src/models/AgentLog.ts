import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from "sequelize";

import { sequelize } from "../config/db";

export class AgentLog extends Model<
  InferAttributes<AgentLog>,
  InferCreationAttributes<AgentLog>
> {
  declare id: CreationOptional<string>;
  declare userId: string | null;
  declare feature: string;
  declare level: "info" | "warning" | "error";
  declare message: string;
  declare createdAt: CreationOptional<Date>;
}

AgentLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "user_id",
    },
    feature: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    level: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "created_at",
    },
  },
  {
    sequelize,
    tableName: "agent_logs",
    underscored: true,
    updatedAt: false,
  },
);

