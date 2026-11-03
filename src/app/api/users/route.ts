import { getDb, serializeDoc } from '../../../../lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const db = await getDb();
    const allUsers = await db.collection('users').find({}).toArray();
    return NextResponse.json({ allUsers: allUsers.map((user) => serializeDoc(user)) }, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}