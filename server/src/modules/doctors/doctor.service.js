import { doctorRepository as defaultDoctorRepo } from './doctor.repository.js';

export class DoctorService {
  /**
   * @param {import('./doctor.repository.js').DoctorRepository} [doctorRepo]
   */
  constructor(doctorRepo = defaultDoctorRepo) {
    this.doctorRepo = doctorRepo;
  }

  /**
   * Retrieves all patients linked to a doctor.
   *
   * @param {string} doctorId
   * @returns {Promise<Array<{ id: string, name: string, email: string }>>}
   */
  async getLinkedPatients(doctorId) {
    return this.doctorRepo.findLinkedPatients(doctorId);
  }

  /**
   * Validates if a doctor is linked to a patient.
   *
   * @param {string} doctorId
   * @param {string} patientId
   * @returns {Promise<boolean>}
   */
  async isDoctorLinkedToPatient(doctorId, patientId) {
    return this.doctorRepo.isDoctorLinkedToPatient(doctorId, patientId);
  }
}

export const doctorService = new DoctorService();
