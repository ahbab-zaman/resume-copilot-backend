import { sequelize } from "../../config/db";
import { Application, type ApplicationStatus } from "../../models/Application";
import { HttpError } from "../../utils/httpError";

type CreateApplicationInput = {
  userId: string;
  company: string;
  role: string;
  status?: ApplicationStatus | undefined;
  appliedDate?: string | undefined;
  notes?: string | null | undefined;
};

type UpdateApplicationInput = {
  company?: string | undefined;
  role?: string | undefined;
  status?: ApplicationStatus | undefined;
  appliedDate?: string | undefined;
  notes?: string | null | undefined;
};

type SerializedApplication = {
  id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  appliedDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

function serializeApplication(application: Application): SerializedApplication {
  return {
    id: application.id,
    company: application.company,
    role: application.role,
    status: application.status,
    appliedDate: application.appliedDate,
    notes: application.notes,
    createdAt: application.createdAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
  };
}

function getDefaultAppliedDate(): string {
  return new Intl.DateTimeFormat("en-CA").format(new Date());
}

function normalizeText(
  value: string | null | undefined,
): string | undefined {
  const trimmed = value?.trim();

  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

export async function listApplications(
  userId: string,
): Promise<SerializedApplication[]> {
  const applications = await Application.findAll({
    where: { userId },
    order: [
      ["appliedDate", "DESC"],
      ["createdAt", "DESC"],
    ],
  });

  return applications.map(serializeApplication);
}

export async function createApplication(
  input: CreateApplicationInput,
): Promise<SerializedApplication> {
  const company = normalizeText(input.company);
  const role = normalizeText(input.role);

  if (!company || !role) {
    throw new HttpError(400, "company and role are required");
  }

  const application = await Application.create({
    userId: input.userId,
    company,
    role,
    status: input.status ?? "applied",
    appliedDate: input.appliedDate ?? getDefaultAppliedDate(),
    notes: normalizeText(input.notes) ?? null,
  });

  return serializeApplication(application);
}

export async function updateApplication(
  userId: string,
  applicationId: string,
  input: UpdateApplicationInput,
): Promise<SerializedApplication> {
  const application = await Application.findOne({
    where: { userId, id: applicationId },
  });

  if (!application) {
    throw new HttpError(404, "Application not found");
  }

  const nextCompany = normalizeText(input.company);
  const nextRole = normalizeText(input.role);
  const nextNotes =
    input.notes === undefined ? undefined : normalizeText(input.notes) ?? null;

  await sequelize.transaction(async (transaction) => {
    if (nextCompany) {
      await application.update({ company: nextCompany }, { transaction });
    }

    if (nextRole) {
      await application.update({ role: nextRole }, { transaction });
    }

    if (input.status) {
      await application.update({ status: input.status }, { transaction });
    }

    if (input.appliedDate) {
      await application.update({ appliedDate: input.appliedDate }, { transaction });
    }

    if (nextNotes !== undefined) {
      await application.update({ notes: nextNotes }, { transaction });
    }
  });

  await application.reload();

  return serializeApplication(application);
}

export async function deleteApplication(
  userId: string,
  applicationId: string,
): Promise<void> {
  const application = await Application.findOne({
    where: { userId, id: applicationId },
  });

  if (!application) {
    throw new HttpError(404, "Application not found");
  }

  await application.destroy();
}
