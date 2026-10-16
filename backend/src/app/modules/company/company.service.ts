import { AppError } from '../../errors/AppError';
import { uploadToCloudinary } from '../../middlewares/upload';
import { prisma } from '../../shared/prisma';
import { generateSlug } from '../auth/auth.utils';

interface ICompanyPayload {
  name: string;
  website?: string;
  industry?: string;
  logoUrl?: string;
}

const upsertCompany = async (
  ownerId: string,
  payload: ICompanyPayload,
  logoFile?: Express.Multer.File,
) => {
  if (logoFile) {
    payload.logoUrl = await uploadToCloudinary(
      logoFile.buffer,
      'company_logos',
      'image',
    );
  }

  const existingCompany = await prisma.company.findUnique({
    where: { ownerId },
  });

  if (existingCompany) {
    let slug = existingCompany.slug;
    if (payload.name && payload.name !== existingCompany.name) {
      slug = generateSlug(payload.name);
    }

    const updatedCompany = await prisma.company.update({
      where: { ownerId },
      data: {
        ...payload,
        slug,
      },
    });

    return updatedCompany;
  }

  const slug = generateSlug(payload.name);

  const newCompany = await prisma.company.create({
    data: {
      ownerId,
      name: payload.name,
      slug,
      website: payload.website,
      industry: payload.industry,
      logoUrl: payload.logoUrl,
      assessmentCredits: 5,
      planTier: 'FREE',
    },
  });

  return newCompany;
};

const getMyCompany = async (ownerId: string) => {
  const company = await prisma.company.findUnique({
    where: { ownerId },
    include: {
      _count: {
        select: {
          problems: true,
          assessments: true,
          payments: true,
        },
      },
    },
  });

  if (!company) {
    throw new AppError(404, 'Company profile not found for this recruiter.');
  }

  return company;
};

export const CompanyService = {
  upsertCompany,
  getMyCompany,
};
