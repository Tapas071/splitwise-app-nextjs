import prisma from '../../../../lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();

    if (!name ) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const newGroup = await prisma.group.create({
      data: {
        name
      },
    });

    return NextResponse.json({ group: newGroup }, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const allGroups = await prisma.group.findMany();

    return NextResponse.json(allGroups, { status: 200 });
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

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();

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