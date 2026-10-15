import { Request, Response } from 'express';
import { catchAsync } from '../../shared/catchAsync';
import { pick } from '../../shared/pick';
import { sendResponse } from '../../shared/sendResponse';
import {
  auditLogFilterableFields,
  paginationFields,
  userFilterableFields,
} from './admin.constant';
import { AdminService } from './admin.service';

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, userFilterableFields);
  const paginationOptions = pick(req.query, paginationFields);

  const result = await AdminService.getAllUsers(filters, paginationOptions);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User directory retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const updateUserRole = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const adminUser = req.user!;

  const result = await AdminService.updateUserRole(id, adminUser, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User role and account status updated successfully',
    data: result,
  });
});

const getDashboardStats = catchAsync(async (_req: Request, res: Response) => {
  const result = await AdminService.getDashboardStats();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Platform dashboard KPIs retrieved successfully',
    data: result,
  });
});

const getAuditLogs = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, auditLogFilterableFields);
  const paginationOptions = pick(req.query, paginationFields);

  const result = await AdminService.getAuditLogs(filters, paginationOptions);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'System audit logs retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const AdminController = {
  getAllUsers,
  updateUserRole,
  getDashboardStats,
  getAuditLogs,
};
