/** @jest-environment node */

import { ObjectId } from 'mongodb';
import { NextRequest } from 'next/server';
import { getDb } from '../../lib/mongodb';
import { PATCH } from '../../src/app/api/groups/[groupId]/settings/route';

jest.mock('../../lib/mongodb', () => {
  const actual = jest.requireActual('../../lib/mongodb');
  return { ...actual, getDb: jest.fn() };
});

const mockedGetDb = getDb as jest.MockedFunction<typeof getDb>;
const groupId = '64a000000000000000000002';
const userId = '64a000000000000000000003';
const groupObjectId = new ObjectId(groupId);

function makeRequest(body: unknown, authenticatedUser?: string) {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (authenticatedUser) headers.set('x-user-id', authenticatedUser);
  return new Request(`http://localhost/api/groups/${groupId}/settings`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  }) as NextRequest;
}

function makeContext() {
  return { params: Promise.resolve({ groupId }) } as never;
}

describe('PATCH /api/groups/[groupId]/settings', () => {
  let membershipFindOne: jest.Mock;
  let groupUpdateOne: jest.Mock;
  let groupFindOne: jest.Mock;

  beforeEach(() => {
    membershipFindOne = jest.fn().mockResolvedValue({ userId, groupId });
    groupUpdateOne = jest.fn().mockResolvedValue({ matchedCount: 1 });
    groupFindOne = jest.fn().mockResolvedValue({ _id: groupObjectId, name: 'Updated trip', currency: 'INR' });
    mockedGetDb.mockResolvedValue({
      collection: jest.fn((name: string) => name === 'userGroups'
        ? { findOne: membershipFindOne }
        : { updateOne: groupUpdateOne, findOne: groupFindOne }),
    } as never);
  });

  it('requires an authenticated user', async () => {
    const response = await PATCH(makeRequest({ name: 'Trip', currency: 'INR' }), makeContext());
    expect(response.status).toBe(401);
    expect(mockedGetDb).not.toHaveBeenCalled();
  });

  it.each(['', '   ', 'x'.repeat(81)])('rejects invalid group names', async (name) => {
    const response = await PATCH(makeRequest({ name, currency: 'INR' }, userId), makeContext());
    expect(response.status).toBe(400);
    expect(membershipFindOne).not.toHaveBeenCalled();
  });

  it('rejects unsupported currencies', async () => {
    const response = await PATCH(makeRequest({ name: 'Trip', currency: 'FAKE' }, userId), makeContext());
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Choose a supported currency.' });
  });

  it('allows only group members to change settings', async () => {
    membershipFindOne.mockResolvedValueOnce(null);
    const response = await PATCH(makeRequest({ name: 'Trip', currency: 'INR' }, userId), makeContext());

    expect(response.status).toBe(403);
    expect(groupUpdateOne).not.toHaveBeenCalled();
  });

  it('trims and persists a valid group name and supported currency', async () => {
    groupFindOne.mockResolvedValueOnce({ _id: groupObjectId, name: 'Summer Trip', currency: 'EUR' });
    const response = await PATCH(makeRequest({ name: '  Summer Trip  ', currency: 'EUR' }, userId), makeContext());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(groupUpdateOne).toHaveBeenCalledWith(
      { _id: groupObjectId },
      { $set: expect.objectContaining({ name: 'Summer Trip', currency: 'EUR', updatedAt: expect.any(Date) }) },
    );
    expect(data.group).toEqual(expect.objectContaining({ name: 'Summer Trip', currency: 'EUR' }));
  });

  it('returns not found when the group does not exist', async () => {
    groupUpdateOne.mockResolvedValueOnce({ matchedCount: 0 });
    const response = await PATCH(makeRequest({ name: 'Trip', currency: 'INR' }, userId), makeContext());

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Group not found.' });
  });
});
