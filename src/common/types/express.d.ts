declare global {
  namespace Express {
    interface User {
      userId: string;
      email: string;
      employeeGrade: string | null;
      roles: string[];
      permissions: string[];
      sid: string | null;
    }
  }
}

export {};
