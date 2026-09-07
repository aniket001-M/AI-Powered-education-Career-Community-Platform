/**
 * User roles supported by CareerGraph.
 * Designed so multi-role users can be added later (Role collection is separate from User).
 */
export enum UserRole {
  STUDENT = 'STUDENT',
  SENIOR = 'SENIOR',
  MENTOR = 'MENTOR',
  FACULTY = 'FACULTY',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
}

export const ALL_ROLES = Object.values(UserRole);
