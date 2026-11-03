import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import HomePageClient from '@/components/HomePageClient';
import prisma from '../../lib/prisma';

interface Group {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

async function getGroups(): Promise<Group[]> {
  return prisma.group.findMany({
    select: { id: true, name: true },
  });
}

async function getUserGroups(userId: string): Promise<Group[]> {
  const memberships = await prisma.userGroup.findMany({
    where: { userId },
    select: { group: { select: { id: true, name: true } } },
  });
  return memberships.map(({ group }) => group);
}

async function getUserDetails(userId: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });
}

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = await  cookieStore.get('token')?.value || "";
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
        const userDetails = await getUserDetails(userId);
        if (userDetails) {
          userName = userDetails.name;
        }
        const allGroups = await getGroups();
        const userGroups = await getUserGroups(userId);
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