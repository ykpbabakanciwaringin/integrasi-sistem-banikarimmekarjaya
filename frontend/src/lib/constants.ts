// src/lib/constants.ts

export const ROLES = {
  STUDENT: "USER", // Sesuai user.go: RoleStudent
  TEACHER: "TEACHER", // Sesuai user.go: RoleTeacher
  ADMIN: "ADMIN", // Sesuai user.go: RoleAdmin
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;

export const QUESTION_TYPES = {
  PG: "PG",
  ESSAY: "ESSAY",
} as const;

export const SESSION_STATUS = {
  REGISTERED: "REGISTERED",
  WORKING: "WORKING",
  FINISHED: "FINISHED",
} as const;
