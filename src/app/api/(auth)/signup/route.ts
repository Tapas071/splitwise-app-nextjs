
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { getDb, serializeDoc } from '../../../../../lib/mongodb';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = await getDb();
    const users = db.collection('users');

    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await users.insertOne({
      name,
      email,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const newUser = serializeDoc({
      _id: result.insertedId,
      name,
      email,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    const token = await new SignJWT({ userId: result.insertedId.toString() })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(secret);

    const response = NextResponse.json({ user: newUser }, { status: 201 });
    response.cookies.set('token', token, { httpOnly: true, path: '/' });

    return response;
  } catch (error) {
    const errorCode =
      error && typeof error === 'object' && 'code' in error
        ? error.code
        : undefined;
    const errorMessage = error instanceof Error ? error.message : '';

    if (errorCode === 'P2002') {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    if (/AuthenticationFailed|bad auth|authentication failed/i.test(errorMessage)) {
      console.error('Signup failed because MongoDB rejected the configured database credentials.');
      return NextResponse.json(
        { error: 'Database authentication failed. Verify the MongoDB database user credentials in DATABASE_URL.' },
        { status: 503 }
      );
    }

    console.error('Signup error:', error instanceof Error ? error.name : 'Unknown error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
