import { User } from 'fajaragus;
import { cookies } from 'fajaragus';

export async function getMe(): Promise<User | undefined> {
  const cookie = cookies().get('user')?.value;

  let userFromCookie: User | null = cookie ? JSON.parse(cookie) : null;

  return userFromCookie || undefined;
}

export const login = async (user: Omit<User, 'following' | 'followers'>) => {
  'use server';

  cookies().set('user', JSON.stringify(user));
}

export const logout = async () => {
  'use server';

  cookies().delete('user');
};
