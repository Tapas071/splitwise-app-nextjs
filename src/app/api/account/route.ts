import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb, serializeDoc, toObjectId } from '../../../../lib/mongodb';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const db = await getDb();
    const user = await db.collection('users').findOne({ _id: toObjectId(userId) });
    if (!user) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

    return NextResponse.json({
      user: { ...serializeDoc(user), password: undefined },
    });
  } catch (error) {
    console.error('Get account settings error:', error);
    return NextResponse.json({ error: 'Unable to load account settings' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

    if (!name || name.length > 80 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Enter a valid name and email address.' }, { status: 400 });
    }
    if (newPassword && (newPassword.length < 8 || !currentPassword)) {
      return NextResponse.json({ error: 'Enter your current password and choose a new password with at least 8 characters.' }, { status: 400 });
    }

    const db = await getDb();
    const users = db.collection('users');
    const objectId = toObjectId(userId);
    if (!objectId) return NextResponse.json({ error: 'Invalid account' }, { status: 401 });

    const user = await users.findOne({ _id: objectId });
    if (!user) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

    const emailOwner = await users.findOne({ email, _id: { $ne: objectId } }, { projection: { _id: 1 } });
    if (emailOwner) return NextResponse.json({ error: 'That email address is already in use.' }, { status: 409 });

    const updates: Record<string, unknown> = { name, email, updatedAt: new Date() };
    if (newPassword) {
      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) return NextResponse.json({ error: 'Your current password is incorrect.' }, { status: 400 });
      updates.password = await bcrypt.hash(newPassword, 10);
    }

    await users.updateOne({ _id: objectId }, { $set: updates });
    return NextResponse.json({ user: { id: userId, name, email } });
  } catch (error) {
    console.error('Update account settings error:', error);
    return NextResponse.json({ error: 'Unable to save account settings' }, { status: 500 });
  }
}
