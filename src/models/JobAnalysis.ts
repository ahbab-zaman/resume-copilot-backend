import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from "sequelize";

import { sequelize } from "../config/db";

export type JobSummary = {
  whatTheyWant: string;
  keyResponsibilities: string[];
};

export class JobAnalysis extends Model<
  InferAttributes<JobAnalysis>,
  InferCreationAttributes<JobAnalysis>
> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare resumeId: string;
  declare jobDescriptionText: string;
  declare jobTitleDetected: string;
  declare seniorityDetected: "junior" | "mid" | "senior";
  declare atsScore: number;
  declare skillsMatch: number;
  declare experienceMatch: number;
  declare educationMatch: number;
  declare missingKeywords: string[];
  declare strengths: string[];
  declare weaknesses: string[];
  declare jobSummary: JobSummary;
  declare aiModelUsed: string;
  declare createdAt: CreationOptional<Date>;
}

JobAnalysis.init(
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
    resumeId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "resume_id",
    },
    jobDescriptionText: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "job_description_text",
    },
    jobTitleDetected: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "job_title_detected",
    },
    seniorityDetected: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "seniority_detected",
    },
    atsScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "ats_score",
    },
    skillsMatch: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "skills_match",
    },
    experienceMatch: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "experience_match",
    },
    educationMatch: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "education_match",
    },
    missingKeywords: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false,
      defaultValue: [],
      field: "missing_keywords",
    },
    strengths: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false,
      defaultValue: [],
    },
    weaknesses: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false,
      defaultValue: [],
    },
    jobSummary: {
      type: DataTypes.JSONB,
      allowNull: false,
      field: "job_summary",
    },
    aiModelUsed: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "ai_model_used",
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
    tableName: "job_analyses",
    underscored: true,
    updatedAt: false,
  },
);

