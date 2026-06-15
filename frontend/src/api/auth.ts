import client from './client';
import type { AuthResponse } from './types';

export async function forgotPassword(email: string): Promise<void> {
  await client.post('/auth/forgot-password', { email });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await client.post('/auth/reset-password', { token, newPassword });
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await client.post<AuthResponse>('/auth/login', { email, password });
  return data;
}

export async function register(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  role: string,
): Promise<AuthResponse> {
  const { data } = await client.post<AuthResponse>('/auth/register', {
    email,
    password,
    firstName,
    lastName,
    role,
  });
  return data;
}
