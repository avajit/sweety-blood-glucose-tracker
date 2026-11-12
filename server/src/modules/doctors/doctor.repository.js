import { prisma as defaultPrisma } from '../../lib/prisma.js';

export class DoctorRepository {
  /**
   * @param {import('@prisma/client').PrismaClient} [prisma]
   */
  constructor(prisma = defaultPrisma) {
    this.prisma = prisma;
  }

  /**
   * Retrieves all patients linked to the specified doctor.
   *
   * @param {string} doctorId
   * @returns {Promise<Array<{ id: string, name: string, email: string }>>}
   */
  async findLinkedPatients(doctorId) {
    const links = await this.prisma.doctorPatient.findMany({
      where: { doctorId },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        patient: {
          name: 'asc',
        },
      },
    });

    return links.map((link) => link.patient);
  }

  /**
   * Checks whether an active link exists between doctor and patient.
   *
   * @param {string} doctorId
   * @param {string} patientId
   * @returns {Promise<boolean>}
   */
  async isDoctorLinkedToPatient(doctorId, patientId) {
    const link = await this.prisma.doctorPatient.findUnique({
      where: {
        doctorId_patientId: {
          doctorId,
          patientId,
        },
      },
    });

    return Boolean(link);
  }
}

export const doctorRepository = new DoctorRepository();
