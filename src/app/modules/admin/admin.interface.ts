import { Role } from '@prisma/client';

export interface IUserFilterRequest {
  searchTerm?: string;
  role?: Role;
  isActive?: boolean | string;
}

export interface IAuditLogFilterRequest {
  searchTerm?: string;
  action?: string;
  entityType?: string;
  actorId?: string;
}

export interface IUpdateUserRolePayload {
  role?: Role;
  isActive?: boolean;
}

export interface IPaginationOptions {
  page?: number | string;
  limit?: number | string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
