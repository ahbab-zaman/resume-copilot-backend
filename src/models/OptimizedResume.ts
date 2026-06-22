import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from "sequelize";

import { sequelize } from "../config/db";

export type OptimizedResumeSectionPair = {
  section: string;
  original: string;
  optimized: string;
  reason: string;
};

export type OptimizedResumeContent = {
  headline: string;
  summary: string;
  sectionPairs: OptimizedResumeSectionPair[];
  keywordIntegrations: string[];
  nextSteps: string[];
};

export class OptimizedResume extends Model<
  InferAttributes<OptimizedResume>,
  InferCreationAttributes<OptimizedResume>
> {
  declare id: CreationOptional<string>;
  declare analysisId: string;
  declare userId: string;
  declare optimizedContent: OptimizedResumeContent;
  declare pdfUrl: string | null;
  declare createdAt: CreationOptional<Date>;
}

OptimizedResume.init(
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
    optimizedContent: {
      type: DataTypes.JSONB,
      allowNull: false,
      field: "optimized_content",
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
    tableName: "optimized_resumes",
    underscored: true,
    updatedAt: false,
  },
);
