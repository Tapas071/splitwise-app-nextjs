import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // In a real-world application, you might want to blacklist the token
    // or perform other server-side cleanup.
    return NextResponse.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
