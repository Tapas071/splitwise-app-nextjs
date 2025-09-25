`use server`
import prisma from '../../lib/prisma';

export async function getUser() {
  const users = await prisma.user.findMany();
  return new Response(JSON.stringify(users));
}