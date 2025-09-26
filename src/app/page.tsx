import { cookies, headers } from 'next/headers';
import { jwtVerify } from 'jose';
import HomePageClient from '@/components/HomePageClient';
import axios from 'axios';

interface Group {
  id: string;
  name: string;
}

async function getGroups(requestHeaders: Headers): Promise<Group[]> {
  const res = await fetch('http://localhost:3000/api/groups', {
    headers: requestHeaders,
    cache: 'no-store',
  });
  if (!res.ok) {
    console.error(`Failed to fetch groups: ${res.status} ${res.statusText}`);
    return [];
  }
  const data = await res.json();
  return data || [];
}

async function getUserGroups(userId: string, requestHeaders: Headers): Promise<Group[]> {
  const res = await fetch(`http://localhost:3000/api/users/${userId}/groups`, {
    headers: requestHeaders,
    cache: 'no-store',
  });
  if (!res.ok) {
    console.error(`Failed to fetch user groups: ${res.status} ${res.statusText}`);
    return [];
  }
  const data = await res.json();
  return data || [];
}

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  console.log('Token from cookies:', token);
  const rawHeaders = await headers();
  const requestHeaders = new Headers(Object.fromEntries(rawHeaders.entries()));

  let userId: string | null = null;
  let joinedGroups: Group[] = [];
  let availableGroups: Group[] = [];

  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
      const { payload } = await jwtVerify(token, secret);
      userId = payload.userId as string;

      if (userId) {
        const allGroups = await getGroups(requestHeaders);
        const userGroups = await getUserGroups(userId, requestHeaders);
        joinedGroups = userGroups;
        availableGroups = allGroups;
      }
    } catch (error) {
      console.error('Invalid token:', error);
    }
  }
  return (
    <HomePageClient
      initialUserId={userId}
      initialJoinedGroups={joinedGroups}
      initialAvailableGroups={availableGroups}
    />
  );
}
