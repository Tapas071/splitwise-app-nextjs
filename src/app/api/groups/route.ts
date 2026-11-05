import { getDb, serializeDoc, toObjectId } from '../../../../lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { name, visibility = 'private' } = await req.json();
    const userId = req.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (visibility !== 'public' && visibility !== 'private') {
      return NextResponse.json({ error: 'Visibility must be public or private' }, { status: 400 });
    }

    const db = await getDb();
    const result = await db.collection('groups').insertOne({
      name: name.trim(),
      currency: 'INR',
      visibility,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.collection('userGroups').insertOne({
      userId,
      groupId: result.insertedId.toString(),
      role: 'admin',
      createdAt: new Date(),
    });

    const newGroup = serializeDoc({
      _id: result.insertedId,
      name: name.trim(),
      currency: 'INR',
      visibility,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ group: newGroup }, { status: 201 });
  } catch (error) {
    console.error('Create group error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const db = await getDb();
    const userId = req.headers.get('x-user-id');
    const memberships = userId ? await db.collection('userGroups').find({ userId }).toArray() : [];
    const groupIds = memberships
      .map((membership) => toObjectId(String(membership.groupId)))
      .filter((id): id is NonNullable<typeof id> => Boolean(id));
    const allGroups = await db.collection('groups').find({
      $or: [{ visibility: 'public' }, { _id: { $in: groupIds } }, { visibility: { $exists: false } }],
    }).toArray();
    return NextResponse.json(allGroups.map((group: any) => serializeDoc({ visibility: 'private', ...group })), { status: 200 });
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, name } = await req.json();

    if (!id || typeof id !== 'string' || !name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid "id" or "name" fields' }, { status: 400 });
    }

    const db = await getDb();
    const result = await db.collection('groups').findOneAndUpdate(
      { _id: toObjectId(id) },
      { $set: { name, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!result || !result.value) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    return NextResponse.json(serializeDoc(result.value), { status: 200 });
  } catch (error) {
    console.error('Error updating group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid "id" field' }, { status: 400 });
    }

    const db = await getDb();
    await db.collection('groups').deleteOne({ _id: toObjectId(id) });

    return NextResponse.json({ message: 'Group deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}