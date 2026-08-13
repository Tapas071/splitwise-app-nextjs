import { NextRequest, NextResponse } from 'next/server';
import { getDb, serializeDoc } from '../../../../../lib/mongodb';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json({ error: 'Missing "name" query parameter' }, { status: 400 });
    }

    const db = await getDb();
    const users = await db.collection('users').find({
      name: { $regex: name, $options: 'i' },
    }).project({ password: 0 }).toArray();

    return NextResponse.json(users.map((user) => serializeDoc(user)), { status: 200 });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
