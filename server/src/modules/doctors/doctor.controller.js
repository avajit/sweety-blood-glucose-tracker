import { doctorService as defaultDoctorService } from './doctor.service.js';

export class DoctorController {
  /**
   * @param {import('./doctor.service.js').DoctorService} [doctorService]
   */
  constructor(doctorService = defaultDoctorService) {
    this.doctorService = doctorService;
  }

  /**
   * GET /api/doctor/patients
   * Lists all patients linked to the authenticated doctor.
   */
  async getPatients(req, res, next) {
    try {
      const patients = await this.doctorService.getLinkedPatients(req.user.id);
      res.status(200).json({ data: patients });
    } catch (err) {
      next(err);
    }
  }
}

export const doctorController = new DoctorController();
