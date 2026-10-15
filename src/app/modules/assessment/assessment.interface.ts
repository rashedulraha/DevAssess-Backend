import { AssessmentStatus } from '@prisma/client';

export interface IAssessmentProblemInput {
  problemId: string;
  orderIndex?: number;
  customPoints?: number;
}

export interface ICreateAssessmentPayload {
  title: string;
  description?: string;
  durationMinutes?: number;
  passingScore?: number;
  maxTabSwitches?: number;
  startAt?: string;
  endAt?: string;
  problems?: IAssessmentProblemInput[];
}

export interface IUpdateAssessmentPayload {
  title?: string;
  description?: string;
  durationMinutes?: number;
  passingScore?: number;
  maxTabSwitches?: number;
  startAt?: string;
  endAt?: string;
  problems?: IAssessmentProblemInput[];
}

export interface IUpdateAssessmentStatusPayload {
  status: AssessmentStatus;
}

export interface IAssessmentFilterRequest {
  searchTerm?: string;
  status?: AssessmentStatus;
  companyId?: string;
}

export interface IPaginationOptions {
  page?: number | string;
  limit?: number | string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
