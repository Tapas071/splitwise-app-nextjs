import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
export async function GET(req: NextRequest, ctx: RouteContext<'/api/users/[userId]'>) {
  try {
     const { userId } = await ctx.params
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return NextResponse.json({ error: 'user not found' }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}