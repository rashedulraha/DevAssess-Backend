import { Request, Response } from 'express';
import { catchAsync } from '../../shared/catchAsync';
import { pick } from '../../shared/pick';
import { sendResponse } from '../../shared/sendResponse';
import { paginationFields, problemFilterableFields } from './problem.constant';
import { ProblemService } from './problem.service';

const createProblem = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const result = await ProblemService.createProblem(user, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Problem created successfully',
    data: result,
  });
});

const getAllProblems = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, problemFilterableFields);
  const paginationOptions = pick(req.query, paginationFields);
  const user = req.user!;

  const result = await ProblemService.getAllProblems(filters, paginationOptions, user);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Problems retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const searchProblems = catchAsync(async (req: Request, res: Response) => {
  const query = pick(req.query, ['q', 'tag']);
  const paginationOptions = pick(req.query, paginationFields);
  const user = req.user!;

  const result = await ProblemService.searchProblems(query, paginationOptions, user);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Problem search results retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getSingleProblem = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const user = req.user!;
  const result = await ProblemService.getSingleProblem(id, user);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Problem retrieved successfully',
    data: result,
  });
});

const updateProblem = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const user = req.user!;
  const result = await ProblemService.updateProblem(id, user, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Problem updated successfully',
    data: result,
  });
});

const deleteProblem = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const user = req.user!;
  const result = await ProblemService.deleteProblem(id, user);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Problem deleted successfully',
    data: result,
  });
});

export const ProblemController = {
  createProblem,
  getAllProblems,
  searchProblems,
  getSingleProblem,
  updateProblem,
  deleteProblem,
};
