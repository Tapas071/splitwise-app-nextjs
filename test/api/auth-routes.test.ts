/** @jest-environment node */

import { ObjectId } from 'mongodb';
import { NextRequest } from 'next/server';
import { compare, hash } from 'bcryptjs';
import { getDb } from '../../lib/mongodb';
import { POST as login } from '../../src/app/api/(auth)/login/route';
import { POST as signup } from '../../src/app/api/(auth)/signup/route';
import { POST as logout } from '../../src/app/api/auth/logout/route';

jest.mock('../../lib/mongodb', () => {
  const actual = jest.requireActual('../../lib/mongodb');
  return { ...actual, getDb: jest.fn() };
});
jest.mock('bcryptjs', () => ({ compare: jest.fn(), hash: jest.fn() }));
jest.mock('jose', () => ({
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue('signed-test-token'),
  })),
}));

const mockedGetDb = getDb as jest.MockedFunction<typeof getDb>;
const mockedCompare = compare as jest.MockedFunction<typeof compare>;
const mockedHash = hash as jest.MockedFunction<typeof hash>;
const accountId = new ObjectId('64a000000000000000000030');

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as NextRequest;
}

describe('authentication routes', () => {
  let findOne: jest.Mock;
  let insertOne: jest.Mock;

  beforeEach(() => {
    findOne = jest.fn();
    insertOne = jest.fn().mockResolvedValue({ insertedId: accountId });
    mockedGetDb.mockResolvedValue({ collection: jest.fn(() => ({ findOne, insertOne })) } as never);
    mockedCompare.mockResolvedValue(true);
    mockedHash.mockResolvedValue('hashed-password' as never);
  });

  describe('signup', () => {
    it('requires name, email, and password', async () => {
      const response = await signup(makeRequest({ name: 'A', email: 'a@test.com' }));
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: 'Missing required fields' });
    });

    it('normalizes email and rejects an existing account', async () => {
      findOne.mockResolvedValueOnce({ _id: accountId });
      const response = await signup(makeRequest({ name: ' A ', email: 'A@Test.com', password: 'secret' }));
      expect(response.status).toBe(409);
      expect(findOne).toHaveBeenCalledWith({ email: 'a@test.com' });
      expect(insertOne).not.toHaveBeenCalled();
    });

    it('creates an account, issues a cookie, and does not expose the password hash', async () => {
      findOne.mockResolvedValueOnce(null);
      const response = await signup(makeRequest({ name: ' Alice ', email: 'ALICE@test.com', password: 'secret' }));
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(mockedHash).toHaveBeenCalledWith('secret', 10);
      expect(insertOne).toHaveBeenCalledWith(expect.objectContaining({ name: 'Alice', email: 'alice@test.com', password: 'hashed-password' }));
      expect(response.cookies.get('token')?.value).toBe('signed-test-token');
      expect(data.user).toEqual(expect.objectContaining({ id: accountId.toString(), name: 'Alice', email: 'alice@test.com' }));
      expect(data.user).not.toHaveProperty('password');
    });
  });

  describe('login', () => {
    it('requires email and password', async () => {
      const response = await login(makeRequest({ email: 'alice@test.com' }));
      expect(response.status).toBe(400);
    });

    it('rejects unknown accounts and incorrect passwords', async () => {
      findOne.mockResolvedValueOnce(null);
      expect((await login(makeRequest({ email: 'missing@test.com', password: 'secret' }))).status).toBe(401);

      findOne.mockResolvedValueOnce({ _id: accountId, email: 'alice@test.com', password: 'hash' });
      mockedCompare.mockResolvedValueOnce(false);
      const response = await login(makeRequest({ email: 'alice@test.com', password: 'wrong' }));
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: 'Invalid credentials' });
    });

    it('returns a session cookie and only public account fields', async () => {
      findOne.mockResolvedValueOnce({ _id: accountId, name: 'Alice', email: 'alice@test.com', password: 'hashed-password' });
      const response = await login(makeRequest({ email: 'alice@test.com', password: 'secret' }));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockedCompare).toHaveBeenCalledWith('secret', 'hashed-password');
      expect(response.cookies.get('token')?.value).toBe('signed-test-token');
      expect(data.user).toEqual({ id: accountId.toString(), name: 'Alice', email: 'alice@test.com' });
      expect(data.user).not.toHaveProperty('password');
    });
  });

  it('clears the session cookie on logout', async () => {
    const response = await logout();
    expect(response.status).toBe(200);
    expect(response.cookies.get('token')?.value).toBe('');
    expect(response.cookies.get('token')?.expires?.getTime()).toBe(0);
  });
});
