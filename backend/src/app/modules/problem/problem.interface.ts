import { Difficulty, ProblemType } from '@prisma/client';

export interface IMcqOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface ICodingTestCase {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

export interface IProblemFilterRequest {
  searchTerm?: string;
  type?: ProblemType;
  difficulty?: Difficulty;
  tag?: string;
}

export interface IProblemSearchQuery {
  q?: string;
  tag?: string;
}

export interface IPaginationOptions {
  page?: number | string;
  limit?: number | string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ICreateProblemPayload {
  title: string;
  description: string;
  type: ProblemType;
  difficulty: Difficulty;
  tags: string[];
  options?: IMcqOption[];
  starterCode?: Record<string, string>;
  testCases?: ICodingTestCase[];
  maxScore?: number;
}

export interface IUpdateProblemPayload {
  title?: string;
  description?: string;
  type?: ProblemType;
  difficulty?: Difficulty;
  tags?: string[];
  options?: IMcqOption[];
  starterCode?: Record<string, string>;
  testCases?: ICodingTestCase[];
  maxScore?: number;
}
