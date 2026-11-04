/** @jest-environment node */

import { ObjectId } from 'mongodb';
import { NextRequest } from 'next/server';
import { getDb } from '../../lib/mongodb';
import { POST } from '../../src/app/api/groups/route';

jest.mock('../../lib/mongodb', () => {
  const actual = jest.requireActual('../../lib/mongodb');
  return { ...actual, getDb: jest.fn() };
});

const mockedGetDb = getDb as jest.MockedFunction<typeof getDb>;
const insertedId = new ObjectId('64a000000000000000000001');

function makeRequest(body: unknown, userId?: string) {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (userId) headers.set('x-user-id', userId);
  return new Request('http://localhost/api/groups', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  }) as NextRequest;
}

describe('POST /api/groups', () => {
  let groups: { insertOne: jest.Mock };
  let userGroups: { insertOne: jest.Mock };

  beforeEach(() => {
    groups = { insertOne: jest.fn().mockResolvedValue({ insertedId }) };
    userGroups = { insertOne: jest.fn().mockResolvedValue({ insertedId: new ObjectId() }) };
    mockedGetDb.mockResolvedValue({
      collection: jest.fn((name: string) => name === 'groups' ? groups : userGroups),
    } as never);
  });

  it('rejects unauthenticated group creation', async () => {
    const response = await POST(makeRequest({ name: 'Trip' }));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Unauthorized' });
    expect(mockedGetDb).not.toHaveBeenCalled();
  });

  it.each([undefined, '', '   ', 42])('rejects an invalid group name: %p', async (name) => {
    const response = await POST(makeRequest({ name }, 'user-1'));
    expect(response.status).toBe(400);
    expect(groups.insertOne).not.toHaveBeenCalled();
  });

  it('trims the group name, defaults currency to INR, and adds the creator as a member', async () => {
    const response = await POST(makeRequest({ name: '  Goa trip  ' }, 'user-1'));
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(groups.insertOne).toHaveBeenCalledWith(expect.objectContaining({ name: 'Goa trip', currency: 'INR' }));
    expect(userGroups.insertOne).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'user-1',
      groupId: insertedId.toString(),
    }));
    expect(data.group).toEqual(expect.objectContaining({ id: insertedId.toString(), name: 'Goa trip', currency: 'INR' }));
  });

  it('returns a server error if database insertion fails', async () => {
    groups.insertOne.mockRejectedValueOnce(new Error('database unavailable'));
    const response = await POST(makeRequest({ name: 'Trip' }, 'user-1'));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Internal server error' });
  });
});
