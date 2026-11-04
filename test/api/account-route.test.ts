/** @jest-environment node */

import { ObjectId } from 'mongodb';
import { NextRequest } from 'next/server';
import { compare, hash } from 'bcryptjs';
import { getDb } from '../../lib/mongodb';
import { GET, PATCH } from '../../src/app/api/account/route';

jest.mock('../../lib/mongodb', () => {
  const actual = jest.requireActual('../../lib/mongodb');
  return { ...actual, getDb: jest.fn() };
});
jest.mock('bcryptjs', () => ({ compare: jest.fn(), hash: jest.fn() }));

const mockedGetDb = getDb as jest.MockedFunction<typeof getDb>;
const mockedCompare = compare as jest.MockedFunction<typeof compare>;
const mockedHash = hash as jest.MockedFunction<typeof hash>;
const userId = '64a000000000000000000040';
const userObjectId = new ObjectId(userId);

function makeRequest(body?: unknown, authenticatedUser?: string) {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (authenticatedUser) headers.set('x-user-id', authenticatedUser);
  return new Request('http://localhost/api/account', {
    method: body === undefined ? 'GET' : 'PATCH',
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }) as NextRequest;
}

describe('/api/account', () => {
  let userFindOne: jest.Mock;
  let userUpdateOne: jest.Mock;
  const user = { _id: userObjectId, name: 'Alice', email: 'alice@test.com', password: 'stored-hash' };

  beforeEach(() => {
    userFindOne = jest.fn().mockImplementation((query: { _id?: unknown; email?: string }) =>
      query._id instanceof ObjectId ? user : null,
    );
    userUpdateOne = jest.fn().mockResolvedValue({ matchedCount: 1 });
    mockedGetDb.mockResolvedValue({ collection: jest.fn(() => ({ findOne: userFindOne, updateOne: userUpdateOne })) } as never);
    mockedCompare.mockResolvedValue(true);
    mockedHash.mockResolvedValue('new-password-hash' as never);
  });

  it('requires authentication for account reads', async () => {
    const response = await GET(makeRequest());
    expect(response.status).toBe(401);
  });

  it('returns account profile data without the password hash', async () => {
    const response = await GET(makeRequest(undefined, userId));
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.user).toEqual(expect.objectContaining({ name: 'Alice', email: 'alice@test.com' }));
    expect(data.user).not.toHaveProperty('password');
  });

  it('rejects invalid names or email addresses', async () => {
    const response = await PATCH(makeRequest({ name: 'Alice', email: 'not-an-email' }, userId));
    expect(response.status).toBe(400);
    expect(userUpdateOne).not.toHaveBeenCalled();
  });

  it('prevents using an email owned by another account', async () => {
    userFindOne.mockImplementation(async (query: { _id?: unknown }) => query._id ? user : { _id: new ObjectId() });
    const response = await PATCH(makeRequest({ name: 'Alice', email: 'taken@test.com' }, userId));
    expect(response.status).toBe(409);
    expect(userUpdateOne).not.toHaveBeenCalled();
  });

  it('updates and normalizes profile details', async () => {
    const response = await PATCH(makeRequest({ name: '  Alice Smith ', email: 'ALICE@TEST.COM' }, userId));
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(userUpdateOne).toHaveBeenCalledWith(
      { _id: userObjectId },
      { $set: expect.objectContaining({ name: 'Alice Smith', email: 'alice@test.com' }) },
    );
    expect(data.user).toEqual({ id: userId, name: 'Alice Smith', email: 'alice@test.com' });
  });

  it('requires the correct current password before changing it', async () => {
    mockedCompare.mockResolvedValueOnce(false);
    const response = await PATCH(makeRequest({
      name: 'Alice', email: 'alice@test.com', currentPassword: 'wrong', newPassword: 'new-password-123',
    }, userId));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Your current password is incorrect.' });
    expect(userUpdateOne).not.toHaveBeenCalled();
  });

  it('hashes a valid new password before saving', async () => {
    const response = await PATCH(makeRequest({
      name: 'Alice', email: 'alice@test.com', currentPassword: 'old-password', newPassword: 'new-password-123',
    }, userId));
    expect(response.status).toBe(200);
    expect(mockedCompare).toHaveBeenCalledWith('old-password', 'stored-hash');
    expect(mockedHash).toHaveBeenCalledWith('new-password-123', 10);
    expect(userUpdateOne).toHaveBeenCalledWith(
      { _id: userObjectId },
      { $set: expect.objectContaining({ password: 'new-password-hash' }) },
    );
  });
});
