import { getDb, serializeDoc, toObjectId } from '../../../../lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();
    const userId = req.headers.get('x-user-id');

    if (typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = await getDb();
    const result = await db.collection('groups').insertOne({
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const newGroup = serializeDoc({
      _id: result.insertedId,
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ group: newGroup }, { status: 201 });
  } catch (error) {
    console.error('Create group error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const db = await getDb();
    const allGroups = await db.collection('groups').find({}).toArray();
    return NextResponse.json(allGroups.map((group) => serializeDoc(group)), { status: 200 });
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