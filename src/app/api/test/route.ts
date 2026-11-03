`use server`

import { getDb, serializeDoc } from '../../../../lib/mongodb';

export const dynamic = 'force-static'
 
export async function GET() {
  const db = await getDb();
  const data = await db.collection('users').find({}).toArray();
  return Response.json({ data: data.map((user) => serializeDoc(user)) })
}

export async function POST() {
  const db = await getDb();
  const name = Math.random().toString(36).substring(7);
  const email = name + "@example.com";
  const result = await db.collection('users').insertOne({
    name,
    email,
    password: 'password',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return Response.json({
    newUser: serializeDoc({
      _id: result.insertedId,
      name,
      email,
      password: 'password',
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  })
}