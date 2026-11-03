
import prisma from '../../../../../lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    const token = await new SignJWT({ userId: newUser.id })
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
