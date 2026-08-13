import React from 'react';
import { cookies, headers } from 'next/headers';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Balance {
  userId: string;
  userName: string;
  balance: number;
}

interface Settlement {
  fromUser: string;
  toUser: string;
  amount: number;
}

interface SettlementData {
  totalExpense: number;
  balances: Balance[];
  settlements: Settlement[];
}

async function getSettlementData(groupId: string, token: string): Promise<SettlementData | null> {
  const baseURL = process.env.BASE_URL || "http://localhost:3000";
  try {
    const response = await fetch(`${baseURL}/api/groups/${groupId}/settlement`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`Failed to fetch settlement data: ${response.status} ${response.statusText}`);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching settlement data:', error);
    return null;
  }
}

const SettlementPage = async ({ params }: { params: Promise<{ groupId: string }> }) => {
  const { groupId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value || "";

  const settlementData = await getSettlementData(groupId, token);

  if (!settlementData) {
    return (
      <div className="container mx-auto p-6 bg-background text-foreground">
        <h1 className="text-4xl font-bold mb-8 text-center">Settlement for Group</h1>
        <p className="text-center text-muted-foreground">Could not load settlement data.</p>
        <div className="flex justify-center mt-6">
          <Button asChild>
            <Link href={`/groups/${groupId}`}>Back to Group</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-background text-foreground">
      <h1 className="text-4xl font-bold mb-8 text-center">Settlement for Group</h1>

      <div className="bg-card border border-border p-6 rounded-lg shadow-sm mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-card-foreground">Total Group Expense</h2>
        <p className="text-3xl font-bold text-chart-1">${settlementData.totalExpense.toFixed(2)}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Balances Section */}
        <div className="bg-card border border-border p-6 rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-card-foreground">Balances</h2>
          <ul className="space-y-3">
            {settlementData.balances.map((balance) => (
              <li
                key={balance.userId}
                className="flex justify-between items-center bg-muted p-3 rounded-md border border-border"
              >
                <span className="font-medium text-muted-foreground">{balance.userName}</span>
                <span className={`font-bold ${balance.balance < 0 ? 'text-destructive' : 'text-chart-1'}`}>
                  ${balance.balance.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Settlements Section */}
        <div className="bg-card border border-border p-6 rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-card-foreground">Settlement Transactions</h2>
          {settlementData.settlements.length > 0 ? (
            <ul className="space-y-3">
              {settlementData.settlements.map((settlement, index) => (
                <li
                  key={index}
                  className="bg-muted p-3 rounded-md border border-border"
                >
                  <p className="text-foreground">
                    <span className="font-medium">{settlement.fromUser}</span> owes <span className="font-medium">{settlement.toUser}</span>
                  </p>
                  <p className="text-xl font-bold text-chart-1">${settlement.amount.toFixed(2)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No settlements needed. Everyone is even!</p>
          )}
        </div>
      </div>

      <div className="flex justify-center mt-8">
        <Button asChild>
          <Link href={`/groups/${groupId}`}>Back to Group</Link>
        </Button>
      </div>
    </div>
  );
};

export default SettlementPage;
