import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from "sequelize";

import { sequelize } from "../config/db";

export class CoverLetter extends Model<
  InferAttributes<CoverLetter>,
  InferCreationAttributes<CoverLetter>
> {
  declare id: CreationOptional<string>;
  declare analysisId: string;
  declare userId: string;
  declare tone: "professional" | "startup" | "corporate";
  declare content: string;
  declare pdfUrl: string | null;
  declare createdAt: CreationOptional<Date>;
}

CoverLetter.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    analysisId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "analysis_id",
    },
    userId: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "user_id",
    },
    tone: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    pdfUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "pdf_url",
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
    tableName: "cover_letters",
    underscored: true,
    updatedAt: false,
  },
);
