/** @jest-environment node */

import { NextRequest } from 'next/server';
import { getDb } from '../../lib/mongodb';
import { isGroupAdmin } from '../../lib/group-access';
import { PATCH } from '../../src/app/api/groups/[groupId]/member/route';

jest.mock('../../lib/mongodb', () => {
  const actual = jest.requireActual('../../lib/mongodb');
  return { ...actual, getDb: jest.fn() };
});
jest.mock('../../lib/group-access', () => ({ isGroupAdmin: jest.fn() }));

const mockedGetDb = getDb as jest.MockedFunction<typeof getDb>;
const mockedIsGroupAdmin = isGroupAdmin as jest.MockedFunction<typeof isGroupAdmin>;
const groupId = '64a000000000000000000020';
const adminId = '64a000000000000000000021';
const memberId = '64a000000000000000000022';

function makeRequest(body: unknown, userId?: string) {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (userId) headers.set('x-user-id', userId);
  return new Request(`http://localhost/api/groups/${groupId}/member`, {
    method: 'PATCH', headers, body: JSON.stringify(body),
  }) as NextRequest;
}

function makeContext() {
  return { params: Promise.resolve({ groupId }) } as never;
}

describe('PATCH /api/groups/[groupId]/member', () => {
  const updateOne = jest.fn();
  const findOne = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    findOne.mockResolvedValue({ userId: memberId, groupId, role: 'member' });
    updateOne.mockResolvedValue({ matchedCount: 1 });
    mockedIsGroupAdmin.mockResolvedValue(true);
    mockedGetDb.mockResolvedValue({
      collection: jest.fn(() => ({ findOne, updateOne })),
    } as never);
  });

  it('requires an authenticated user', async () => {
    const response = await PATCH(makeRequest({ userId: memberId, role: 'admin' }), makeContext());
    expect(response.status).toBe(401);
  });

  it('rejects role changes by non-admins', async () => {
    mockedIsGroupAdmin.mockResolvedValueOnce(false);
    const response = await PATCH(makeRequest({ userId: memberId, role: 'admin' }, memberId), makeContext());
    expect(response.status).toBe(403);
    expect(updateOne).not.toHaveBeenCalled();
  });

  it('lets an admin promote a group member', async () => {
    const response = await PATCH(makeRequest({ userId: memberId, role: 'admin' }, adminId), makeContext());
    expect(response.status).toBe(200);
    expect(updateOne).toHaveBeenCalledWith(
      { userId: memberId, groupId },
      { $set: { role: 'admin', updatedAt: expect.any(Date) } },
    );
  });

  it('does not allow demoting the last admin', async () => {
    findOne.mockResolvedValueOnce({ userId: adminId, groupId, role: 'admin' });
    mockedIsGroupAdmin.mockResolvedValueOnce(true).mockResolvedValueOnce(true);
    const find = jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([{ userId: adminId, groupId, role: 'admin' }]) });
    mockedGetDb.mockResolvedValue({
      collection: jest.fn(() => ({ findOne, find, updateOne })),
    } as never);

    const response = await PATCH(makeRequest({ userId: adminId, role: 'member' }, adminId), makeContext());
    expect(response.status).toBe(409);
    expect(updateOne).not.toHaveBeenCalled();
  });
});
