import { cookies, headers } from 'next/headers';
import { jwtVerify } from 'jose';
import HomePageClient from '@/components/HomePageClient';

interface Group {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
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
  const groups = data?.groups;
  console.log('Fetched user groups:', groups);
  return groups || [];
}

async function getUserDetails(userId: string, requestHeaders: Headers): Promise<User | null> {
  const res = await fetch(`http://localhost:3000/api/users/${userId}`, {
    headers: requestHeaders,
    cache: 'no-store',
  });
  if (!res.ok) {
    console.error(`Failed to fetch user details for ${userId}: ${res.status} ${res.statusText}`);
    return null;
  }
  const data = await res.json();
  return data || null;
}

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = await  cookieStore.get('token')?.value || "";
  const rawHeaders = await headers();
  const requestHeaders = new Headers(Object.fromEntries(rawHeaders.entries()));

  let userId: string | null = null;
  let userName: string | null = null;
  let joinedGroups: Group[] = [];
  let availableGroups: Group[] = [];

  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
      const { payload } = await jwtVerify(token, secret);
      userId = payload.userId as string;

      if (userId) {
        const userDetails = await getUserDetails(userId, requestHeaders);
        if (userDetails) {
          userName = userDetails.name;
        }
        const allGroups = await getGroups(requestHeaders);
        const userGroups = await getUserGroups(userId, requestHeaders);
        joinedGroups = userGroups;
        availableGroups = allGroups;
      }
    } catch (error: any) {
      if (error?.code === 'ERR_JWT_EXPIRED') {
        console.log('Token has expired.');
      } else {
        console.error('Invalid token:', error);
      }
    }
  }
  return (
    <HomePageClient
      initialUserId={userId}
      initialUserName={userName}
      initialJoinedGroups={joinedGroups}
      initialAvailableGroups={availableGroups}
      token={token}
    />
  );
}