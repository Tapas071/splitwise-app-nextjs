// import type { NextRequest } from 'next/server'
import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
export async function PUT(req: NextRequest, ctx: RouteContext<'/api/groups/[groupId]'>) {
       const { groupId } = await ctx.params
      try {
    const id = groupId;
    const {  name } = await req.json();

    if (!id || typeof id !== 'string' || !name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid "id" or "name" fields' }, { status: 400 });
    }

    const updatedGroup = await prisma.group.update({
      where: { id },
      data: { name },
    });

    return NextResponse.json(updatedGroup, { status: 200 });
  } catch (error) {
    console.error('Error updating group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export async function DELETE(req: NextRequest, ctx: RouteContext<'/api/groups/[groupId]'>) {
       const { groupId } = await ctx.params
      try {
    const id = groupId;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid "id" field' }, { status: 400 });
    }

    await prisma.group.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Group deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, ctx: RouteContext<'/api/groups/[groupId]'>) {
  try {
     const { groupId } = await ctx.params
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: true,
        expenses: {
          include: {
            paidBy: true,
            splitAmong: true,
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    return NextResponse.json(group, { status: 200 });
  } catch (error) {
    console.error('Error fetching group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}