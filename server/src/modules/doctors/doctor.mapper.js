/**
 * Maps raw patient database record to safe public response shape.
 *
 * @param {object} patient
 * @param {string} patient.id
 * @param {string} patient.name
 * @param {string} patient.email
 * @returns {{ id: string, name: string, email: string }}
 */
export function toPatientResponse(patient) {
  return {
    id: patient.id,
    name: patient.name,
    email: patient.email,
  };
}
