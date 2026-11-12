import { Router } from 'express';
import { z } from 'zod';
import { reportTypeSchema, reportQuerySchema } from '@sweety/shared/schemas/report.schema.js';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { validate } from '../../common/middleware/validate.middleware.js';
import { reportController } from './report.controller.js';

export const reportsRouter = Router();

// Protect all reports endpoints with authentication
reportsRouter.use(authenticate);

const reportParamsSchema = z.object({
  type: reportTypeSchema,
});

reportsRouter.get(
  '/:type',
  validate(reportParamsSchema, 'params'),
  validate(reportQuerySchema, 'query'),
  reportController.getReport,
);
