export interface User {
  userId: number;
  email: string;
  fullName: string;
  token: string;
  isLoggedIn: boolean;
}

export type AuthTab = 'signin' | 'signup' | 'forgot';

export interface NotificationItem {
  title: string;
  severity: string;
  tableName?: string;
}
