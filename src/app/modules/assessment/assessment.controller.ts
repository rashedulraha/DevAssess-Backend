import { Request, Response } from 'express';
import { catchAsync } from '../../shared/catchAsync';
import { pick } from '../../shared/pick';
import { sendResponse } from '../../shared/sendResponse';
import { assessmentFilterableFields, paginationFields } from './assessment.constant';
import { AssessmentService } from './assessment.service';

const createAssessment = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const result = await AssessmentService.createAssessment(user, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Assessment created successfully',
    data: result,
  });
});

const getAllAssessments = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, assessmentFilterableFields);
  const paginationOptions = pick(req.query, paginationFields);
  const user = req.user!;

  const result = await AssessmentService.getAllAssessments(filters, paginationOptions, user);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Assessments retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getSingleAssessment = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const user = req.user!;

  const result = await AssessmentService.getSingleAssessment(id, user);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Assessment retrieved successfully',
    data: result,
  });
});

const updateAssessment = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const user = req.user!;

  const result = await AssessmentService.updateAssessment(id, user, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Assessment updated successfully',
    data: result,
  });
});

const updateAssessmentStatus = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const user = req.user!;
  const { status } = req.body;

  const result = await AssessmentService.updateAssessmentStatus(id, user, status);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `Assessment status updated to ${status} successfully`,
    data: result,
  });
});

const deleteAssessment = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const user = req.user!;

  const result = await AssessmentService.deleteAssessment(id, user);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Assessment deleted successfully',
    data: result,
  });
});

export const AssessmentController = {
  createAssessment,
  getAllAssessments,
  getSingleAssessment,
  updateAssessment,
  updateAssessmentStatus,
  deleteAssessment,
};
