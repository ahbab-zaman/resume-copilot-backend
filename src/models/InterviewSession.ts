import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from "sequelize";

import { sequelize } from "../config/db";
import type {
  InterviewDifficulty,
  InterviewQuestion,
  InterviewRole,
} from "../services/ai/prompts/interviewQuestions";

export class InterviewSession extends Model<
  InferAttributes<InterviewSession>,
  InferCreationAttributes<InterviewSession>
> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare role: InterviewRole;
  declare difficulty: InterviewDifficulty;
  declare questions: InterviewQuestion[];
  declare createdAt: CreationOptional<Date>;
}

InterviewSession.init(
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
    role: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    difficulty: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    questions: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
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
    tableName: "interview_sessions",
    underscored: true,
    updatedAt: false,
  },
);
