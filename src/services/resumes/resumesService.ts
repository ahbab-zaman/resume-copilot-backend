import { Op, Transaction, type Transaction as SequelizeTransaction } from "sequelize";

import { sequelize } from "../../config/db";
import { Resume } from "../../models/Resume";
import { HttpError } from "../../utils/httpError";
import { extractResumeText } from "../parsing/extractResumeText";

type CreateResumeInput = {
  userId: string;
  fileBuffer: Buffer;
  originalFileName: string;
  title?: string;
};

type UpdateResumeInput = {
  title?: string | undefined;
  isActive?: boolean | undefined;
};

function getFallbackTitle(fileName: string): string {
  const withoutExtension = fileName.replace(/\.[^.]+$/, "");
  const trimmed = withoutExtension.trim();

  return trimmed.length > 0 ? trimmed : "Untitled Resume";
}

async function activateResume(
  userId: string,
  resumeId: string,
  transaction: SequelizeTransaction,
): Promise<void> {
  await Resume.update(
    { isActive: false },
    {
      where: {
        userId,
        id: {
          [Op.ne]: resumeId,
        },
      },
      transaction,
    },
  );

  await Resume.update(
    { isActive: true },
    {
      where: {
        userId,
        id: resumeId,
      },
      transaction,
    },
  );
}

export async function listResumes(userId: string): Promise<Resume[]> {
  return Resume.findAll({
    where: { userId },
    order: [
      ["isActive", "DESC"],
      ["createdAt", "DESC"],
    ],
  });
}

export async function createResume(
  input: CreateResumeInput,
): Promise<Resume> {
  const parsedText = await extractResumeText(input.fileBuffer);
  const resumeTitle = input.title?.trim() || getFallbackTitle(input.originalFileName);

  return sequelize.transaction(async (transaction) => {
    const activeResume = await Resume.findOne({
      where: {
        userId: input.userId,
        isActive: true,
      },
      transaction,
      lock: Transaction.LOCK.UPDATE,
    });

    const resume = await Resume.create(
      {
        userId: input.userId,
        title: resumeTitle,
        originalFileUrl: input.originalFileName,
        parsedText,
        isActive: activeResume === null,
      },
      { transaction },
    );

    if (activeResume === null) {
      await activateResume(input.userId, resume.id, transaction);
    }

    return resume;
  });
}

export async function updateResume(
  userId: string,
  resumeId: string,
  input: UpdateResumeInput,
): Promise<Resume> {
  const resume = await Resume.findOne({
    where: { userId, id: resumeId },
  });

  if (!resume) {
    throw new HttpError(404, "Resume not found");
  }

  const title = input.title?.trim();
  const nextTitle = title && title.length > 0 ? title : undefined;

  return sequelize.transaction(async (transaction) => {
    if (nextTitle) {
      await resume.update(
        { title: nextTitle },
        { transaction },
      );
    }

    if (input.isActive) {
      await activateResume(userId, resumeId, transaction);
      await resume.reload({ transaction });
    }

    return resume;
  });
}

export async function deleteResume(
  userId: string,
  resumeId: string,
): Promise<void> {
  const resume = await Resume.findOne({
    where: { userId, id: resumeId },
  });

  if (!resume) {
    throw new HttpError(404, "Resume not found");
  }

  await sequelize.transaction(async (transaction) => {
    const wasActive = resume.isActive;
    await resume.destroy({ transaction });

    if (!wasActive) {
      return;
    }

    const nextResume = await Resume.findOne({
      where: {
        userId,
      },
      order: [["createdAt", "DESC"]],
      transaction,
    });

    await Resume.update(
      { isActive: false },
      {
        where: {
          userId,
        },
        transaction,
      },
    );

    if (nextResume) {
      await nextResume.update(
        { isActive: true },
        { transaction },
      );
    }
  });
}
