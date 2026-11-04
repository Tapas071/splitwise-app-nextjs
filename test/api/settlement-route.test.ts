/** @jest-environment node */

import { ObjectId } from 'mongodb';
import { NextRequest } from 'next/server';
import { getDb } from '../../lib/mongodb';
import { GET } from '../../src/app/api/groups/[groupId]/settlement/route';

jest.mock('../../lib/mongodb', () => {
  const actual = jest.requireActual('../../lib/mongodb');
  return { ...actual, getDb: jest.fn() };
});

const mockedGetDb = getDb as jest.MockedFunction<typeof getDb>;
const groupId = '64a000000000000000000020';
const aliceId = '64a000000000000000000021';
const bobId = '64a000000000000000000022';
const carolId = '64a000000000000000000023';

function makeContext() {
  return { params: Promise.resolve({ groupId }) } as never;
}

const makeFind = (documents: unknown[]) => ({
  find: jest.fn(() => ({ toArray: jest.fn().mockResolvedValue(documents) })),
});

describe('GET /api/groups/[groupId]/settlement', () => {
  const groups = { findOne: jest.fn() };
  const memberships = makeFind([
    { userId: aliceId },
    { userId: bobId },
    { userId: carolId },
  ]);
  const expenses = makeFind([{
    amount: 120,
    paidById: aliceId,
    splitAmong: [
      { userId: aliceId, amount: 40 },
      { userId: bobId, amount: 40 },
      { userId: carolId, amount: 40 },
    ],
  }]);
  const users = makeFind([
    { _id: new ObjectId(aliceId), name: 'Alice' },
    { _id: new ObjectId(bobId), name: 'Bob' },
    { _id: new ObjectId(carolId), name: 'Carol' },
  ]);

  beforeEach(() => {
    groups.findOne.mockResolvedValue({ currency: 'INR' });
    memberships.find.mockClear();
    expenses.find.mockClear();
    users.find.mockClear();
    mockedGetDb.mockResolvedValue({
      collection: jest.fn((name: string) => ({
        groups,
        userGroups: memberships,
        expenses,
        users,
      })[name]),
    } as never);
  });

  it('returns 404 for an unknown group', async () => {
    groups.findOne.mockResolvedValueOnce(null);
    const response = await GET(new Request('http://localhost') as NextRequest, makeContext());

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Group not found' });
  });

  it('calculates balances and minimum settlement transfers using the group currency', async () => {
    const response = await GET(new Request('http://localhost') as NextRequest, makeContext());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.totalExpense).toBe(120);
    expect(data.currency).toBe('INR');
    expect(data.balances).toEqual([
      { userId: aliceId, userName: 'Alice', balance: 80 },
      { userId: bobId, userName: 'Bob', balance: -40 },
      { userId: carolId, userName: 'Carol', balance: -40 },
    ]);
    expect(data.settlements).toEqual([
      { fromUser: 'Bob', toUser: 'Alice', amount: 40 },
      { fromUser: 'Carol', toUser: 'Alice', amount: 40 },
    ]);
  });

  it('returns zero balances and no transfers when there are no expenses', async () => {
    expenses.find.mockImplementationOnce(() => ({ toArray: jest.fn().mockResolvedValue([]) }));
    const response = await GET(new Request('http://localhost') as NextRequest, makeContext());
    const data = await response.json();

    expect(data.totalExpense).toBe(0);
    expect(data.balances.every((balance: { balance: number }) => balance.balance === 0)).toBe(true);
    expect(data.settlements).toEqual([]);
  });
});
