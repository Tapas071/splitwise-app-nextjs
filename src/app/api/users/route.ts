import prisma from '../../../../lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
export async function GET(req: NextRequest) {
  try {
    const allUsers = await prisma.user.findMany();
    return NextResponse.json({ allUsers: allUsers }, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}