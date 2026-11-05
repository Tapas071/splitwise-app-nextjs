import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import HomePageClient from '@/components/HomePageClient';
import { getDb, toObjectId } from '../../lib/mongodb';
import prisma from '../../lib/prisma';

interface Group {
  id: string;
  name: string;
  currency: string;
  visibility: 'public' | 'private';
}

interface User {
  id: string;
  name: string;
  email: string;
}

async function getGroups(): Promise<Group[]> {
  const db = await getDb();
  const groups = await db.collection('groups').find({
    $or: [{ visibility: 'public' }, { visibility: { $exists: false } }],
  }).toArray();

  return groups.map((group) => ({
    id: group._id.toString(),
    name: String(group.name),
    currency: String(group.currency || 'INR'),
    visibility: String(group.visibility || 'public') as 'public' | 'private',
  }));
}

async function getUserGroups(userId: string): Promise<Group[]> {
  const db = await getDb();
  const memberships = await db.collection('userGroups').find({ userId }).toArray();
  const groupIds = memberships
    .map((membership) => toObjectId(String(membership.groupId)))
    .filter((id): id is NonNullable<typeof id> => Boolean(id));
  const groups = await db.collection('groups').find({ _id: { $in: groupIds } }).toArray();

  return groups.map((group) => ({
    id: group._id.toString(),
    name: String(group.name),
    currency: String(group.currency || 'INR'),
    visibility: String(group.visibility || 'private') as 'public' | 'private',
  }));
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