`use server`

import prisma from '../../../../lib/prisma';

export const dynamic = 'force-static'
 
export async function GET() {
  const data = await prisma.user.findMany();
 
  return Response.json({ data })
}

export async function POST() {
//   const data = await prisma.user2.findMany();
const name = Math.random().toString(36).substring(7);
const email = name + "@example.com";
  const newUser = await prisma.user.create({
      data: {
        name: name as string,
        email: email as string,
        password: "password" as string,
        
      },
    });
 
  return Response.json({ newUser })
}