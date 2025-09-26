import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../../lib/prisma';

export async function GET(
  req: NextRequest,
  ctx: RouteContext<'/api/users/[userId]/groups'>
) {
  try {
    const { userId } = await ctx.params

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        groups: {
          include: {
            group: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const groups = user.groups.map((userGroup:any) => userGroup.group);

    return NextResponse.json({ groups });
  } catch (error) {
    console.error('Get user groups error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
