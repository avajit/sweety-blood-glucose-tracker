/**
 * Maps a raw database User record into a safe public representation.
 * Explicitly excludes sensitive fields such as passwordHash.
 *
 * @param {object} user - Database user record
 * @returns {{ id: string, name: string, email: string, role: string }} Safe user object
 */
export function toPublicUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
