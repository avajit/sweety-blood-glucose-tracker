import { doctorRepository } from './doctor.repository.js';
import { ForbiddenError } from '../../common/errors/httpErrors.js';
import { MESSAGES } from '@sweety/shared/constants/messages.js';

/**
 * Middleware policy ensuring that a doctor only accesses reports or resources
 * of patients who are explicitly linked to them in the DoctorPatient table.
 */
export async function patientAccessPolicy(req, _res, next) {
  const patientId = req.query.patientId || req.params.patientId;
  if (!patientId) {
    return next();
  }

  try {
    const isLinked = await doctorRepository.isDoctorLinkedToPatient(req.user.id, patientId);
    if (!isLinked) {
      return next(new ForbiddenError(MESSAGES.AUTH_FORBIDDEN));
    }
    next();
  } catch (err) {
    next(err);
  }
}
