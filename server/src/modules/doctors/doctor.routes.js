import { Router } from 'express';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { authorizeRoles } from '../../common/middleware/role.middleware.js';
import { ROLES } from '@sweety/shared/constants/roles.js';
import { doctorController } from './doctor.controller.js';

export const doctorRouter = Router();

// Doctor routes strictly require authentication and DOCTOR role
doctorRouter.use(authenticate);
doctorRouter.use(authorizeRoles(ROLES.DOCTOR));

doctorRouter.get('/patients', (req, res, next) => doctorController.getPatients(req, res, next));
