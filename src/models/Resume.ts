import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from "sequelize";

import { sequelize } from "../config/db";

export class Resume extends Model<
  InferAttributes<Resume>,
  InferCreationAttributes<Resume>
> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare title: string;
  declare originalFileUrl: string;
  declare parsedText: string;
  declare isActive: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Resume.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "user_id",
    },
    title: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    originalFileUrl: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "original_file_url",
    },
    parsedText: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "parsed_text",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_active",
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "created_at",
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "updated_at",
    },
  },
  {
    sequelize,
    tableName: "resumes",
    underscored: true,
  },
);
