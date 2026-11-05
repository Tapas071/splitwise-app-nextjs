/** @jest-environment node */

import { ObjectId } from 'mongodb';
import { NextRequest } from 'next/server';
import { getDb } from '../../lib/mongodb';
import { POST } from '../../src/app/api/expenses/route';

jest.mock('../../lib/mongodb', () => {
  const actual = jest.requireActual('../../lib/mongodb');
  return { ...actual, getDb: jest.fn() };
});

const mockedGetDb = getDb as jest.MockedFunction<typeof getDb>;
const groupId = '64a000000000000000000010';
const paidById = '64a000000000000000000011';
const splitUserId = '64a000000000000000000012';

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': paidById },
    body: JSON.stringify(body),
  }) as NextRequest;
}

function expenseBody(overrides: Record<string, unknown> = {}) {
  return {
    description: 'Dinner',
    amount: 100,
    paidById,
    groupId,
    splitAmong: [{ userId: paidById, amount: 50 }, { userId: splitUserId, amount: 50 }],
    ...overrides,
  };
}

describe('POST /api/expenses', () => {
  let groupFindOne: jest.Mock;
  let userFindOne: jest.Mock;
  let membershipFindOne: jest.Mock;
  let membershipFind: jest.Mock;
  let expenseInsertOne: jest.Mock;

  beforeEach(() => {
    groupFindOne = jest.fn().mockResolvedValue({ _id: new ObjectId(groupId) });
    userFindOne = jest.fn().mockResolvedValue({ _id: new ObjectId(paidById) });
    membershipFindOne = jest.fn().mockResolvedValue({ userId: paidById, groupId });
    membershipFind = jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([
      { userId: paidById, groupId }, { userId: splitUserId, groupId },
    ]) });
    expenseInsertOne = jest.fn().mockResolvedValue({ insertedId: new ObjectId('64a000000000000000000013') });
    mockedGetDb.mockResolvedValue({
      collection: jest.fn((name: string) => {
        if (name === 'groups') return { findOne: groupFindOne };
        if (name === 'users') return { findOne: userFindOne };
        if (name === 'userGroups') return { findOne: membershipFindOne, find: membershipFind };
        return { insertOne: expenseInsertOne };
      }),
    } as never);
  });

  it('rejects missing or incorrectly typed fields', async () => {
    const response = await POST(makeRequest(expenseBody({ amount: '100' })));
    expect(response.status).toBe(400);
    expect(expenseInsertOne).not.toHaveBeenCalled();
  });

  it('returns not found when the target group is missing', async () => {
    groupFindOne.mockResolvedValueOnce(null);
    const response = await POST(makeRequest(expenseBody()));

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Group not found' });
  });

  it('returns not found when the payer does not exist', async () => {
    userFindOne.mockResolvedValueOnce(null);
    const response = await POST(makeRequest(expenseBody()));

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Payer not found' });
  });

  it('rejects splits that do not sum to the expense total', async () => {
    const response = await POST(makeRequest(expenseBody({
      splitAmong: [{ userId: paidById, amount: 25 }, { userId: splitUserId, amount: 25 }],
    })));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Split amounts do not add up to the total amount' });
    expect(expenseInsertOne).not.toHaveBeenCalled();
  });

  it('creates an expense with normalized split amounts', async () => {
    const response = await POST(makeRequest(expenseBody({
      splitAmong: [{ userId: paidById, amount: 45 }, { userId: splitUserId, amount: '55' }],
    })));
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(expenseInsertOne).toHaveBeenCalledWith(expect.objectContaining({
      description: 'Dinner',
      amount: 100,
      paidById,
      groupId,
      splitAmong: [{ userId: paidById, amount: 45 }, { userId: splitUserId, amount: 55 }],
    }));
    expect(data).toEqual(expect.objectContaining({ amount: 100, splitAmong: expect.arrayContaining([
      { userId: paidById, amount: 45 },
      { userId: splitUserId, amount: 55 },
    ]) }));
  });
});
