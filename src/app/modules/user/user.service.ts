import { AppError } from '../../errors/AppError';
import { uploadToCloudinary } from '../../middlewares/upload';
import { prisma } from '../../shared/prisma';

const getMyProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      avatarUrl: true,
      resumeUrl: true,
      bio: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      company: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          industry: true,
          assessmentCredits: true,
          planTier: true,
        },
      },
      _count: {
        select: {
          attempts: true,
          invitations: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError(404, 'User profile not found.');
  }

  if (!user.isActive) {
    throw new AppError(403, 'User account is deactivated.');
  }

  return user;
};

const updateMyProfile = async (
  userId: string,
  payload: {
    fullName?: string;
    bio?: string;
    avatarUrl?: string;
    resumeUrl?: string;
  },
  files?: {
    avatar?: Express.Multer.File[];
    resume?: Express.Multer.File[];
  },
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || user.deletedAt) {
    throw new AppError(404, 'User not found.');
  }

  if (!user.isActive) {
    throw new AppError(403, 'User account is deactivated.');
  }

  // Handle uploaded files via Cloudinary stream
  if (files?.avatar && files.avatar.length > 0) {
    const avatarBuffer = files.avatar[0].buffer;
    payload.avatarUrl = await uploadToCloudinary(avatarBuffer, 'avatars', 'image');
  }

  if (files?.resume && files.resume.length > 0) {
    const resumeBuffer = files.resume[0].buffer;
    payload.resumeUrl = await uploadToCloudinary(resumeBuffer, 'resumes', 'auto');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: payload,
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      avatarUrl: true,
      resumeUrl: true,
      bio: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      company: true,
    },
  });

  return updatedUser;
};

export const UserService = {
  getMyProfile,
  updateMyProfile,
};
