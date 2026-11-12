import { Router } from 'express';
import { createReadingSchema, updateReadingSchema } from '@sweety/shared/schemas/reading.schema.js';
import { paginationQuerySchema } from '@sweety/shared/schemas/pagination.schema.js';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { validate } from '../../common/middleware/validate.middleware.js';
import { readingController } from './reading.controller.js';

export const readingsRouter = Router();

// Protect all reading routes with authentication
readingsRouter.use(authenticate);

readingsRouter.get('/', validate(paginationQuerySchema, 'query'), readingController.getReadings);
readingsRouter.post('/', validate(createReadingSchema, 'body'), readingController.createReading);
readingsRouter.patch('/:id', validate(updateReadingSchema, 'body'), readingController.updateReading);
readingsRouter.delete('/:id', readingController.deleteReading);
