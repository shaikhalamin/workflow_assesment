declare global {
  namespace Express {
    interface User {
      userId: string;
      wsid: string | null;
      roles: string[];
      sid: string;
    }
  }
}

export {};
