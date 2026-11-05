'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/currencies';
import { Plus, Send } from 'lucide-react';

interface Member {
  id: string;
  userId: string;
}

interface AddExpenseModalProps {
  members: Member[];
  groupId: string;
  memberNames: { [key: string]: string };
  token: string;
  currency?: string;
  composer?: boolean;
}

interface CustomSplit {
  userId: string;
  amount: string;
}

export const AddExpenseModal = ({ members, groupId, memberNames, token, currency = 'INR', composer = false }: AddExpenseModalProps) => {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');
  const [customSplits, setCustomSplits] = useState<CustomSplit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Initialize custom splits when selected members change
  React.useEffect(() => {
    setCustomSplits(selectedMembers.map(userId => ({
      userId,
      amount: '',
    })));
  }, [selectedMembers]);

  const handleCustomSplitChange = (userId: string, value: string) => {
    setCustomSplits(prev =>
      prev.map(split =>
        split.userId === userId ? { ...split, amount: value } : split
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const totalAmount = parseFloat(amount);
      if (isNaN(totalAmount) || totalAmount <= 0) {
        throw new Error('Please enter a valid amount.');
      }

      let splitAmongData: { userId: string; amount: number }[] = [];

      if (splitType === 'equal') {
        if (selectedMembers.length === 0) {
          throw new Error('Please select members to split the expense.');
        }
        const equalSplitAmount = totalAmount / selectedMembers.length;
        splitAmongData = selectedMembers.map(userId => ({
          userId,
          amount: parseFloat(equalSplitAmount.toFixed(2)), // Ensure 2 decimal places
        }));
      } else { // custom split
        let customTotal = 0;
        splitAmongData = customSplits.map(split => {
          const splitAmount = parseFloat(split.amount);
          if (isNaN(splitAmount) || splitAmount < 0) {
            throw new Error(`Please enter a valid amount for ${memberNames[split.userId] || split.userId}.`);
          }
          customTotal += splitAmount;
          return { userId: split.userId, amount: splitAmount };
        });

        if (Math.abs(customTotal - totalAmount) > 0.01) { // Allow for minor floating point inaccuracies
          throw new Error(`Custom split amounts do not add up to the total amount. Remaining: ${(totalAmount - customTotal).toFixed(2)}`);
        }
      }

      const expenseData = {
        groupId,
        description,
        amount: totalAmount,
        paidById: paidBy,
        splitAmong: splitAmongData,
      };

      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(expenseData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to create expense. Please try again.');
      }

      // Reset form
      setDescription('');
      setAmount('');
      setPaidBy('');
      setSelectedMembers([]);
      setSplitType('equal');
      setCustomSplits([]);
      setOpen(false);

      // Refresh the page to show new expense immediately
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create expense. Please try again.');
      console.error('Error creating expense:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev => {
      const newSelected = prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId];
      return newSelected;
    });
  };

  const currentTotalAmount = parseFloat(amount) || 0;
  const currentCustomSplitTotal = customSplits.reduce((acc, split) => acc + (parseFloat(split.amount) || 0), 0);
  const remainingAmount = currentTotalAmount - currentCustomSplitTotal;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {composer ? (
          <Button className="h-12 w-full justify-between rounded-2xl px-4 text-left shadow-lg shadow-primary/15">
            <span className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-full bg-primary-foreground/15"><Plus className="size-4" /></span><span className="font-medium">Add an expense to the chat…</span></span>
            <Send className="size-4" />
          </Button>
        ) : <Button className="w-full rounded-xl">Add Expense</Button>}
      </DialogTrigger>
      <DialogContent className="max-h-[85dvh] overflow-y-auto bg-popover border-border sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-popover-foreground">Add New Expense</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Create a new expense and split it among group members.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2 text-foreground">
              Description
            </label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              disabled={isLoading}
              className="field-control disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="e.g., Dinner at restaurant"
            />
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium mb-2 text-foreground">
              Amount ({currency})
            </label>
            <input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              disabled={isLoading}
              className="field-control disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="0.00"
            />
          </div>

          <div>
            <label htmlFor="paidBy" className="block text-sm font-medium mb-2 text-foreground">
              Paid By
            </label>
            <select
              id="paidBy"
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              required
              disabled={isLoading}
              className="field-control disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select member</option>
              {members.map((member) => (
                <option key={member.id} value={member.userId}>
                  {memberNames[member.userId] || `User ID: ${member.userId}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p id="splitAmongLabel" className="mb-2 block text-sm font-medium text-foreground">
              Split Among
            </p>
            <div aria-labelledby="splitAmongLabel" className="max-h-60 space-y-2 overflow-y-auto rounded-xl border border-input bg-muted/70 p-3">
              {members.map((member) => (
                <label
                  key={member.id}
                  className={`flex cursor-pointer items-center space-x-2 rounded-lg p-2.5 transition-colors hover:bg-accent ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(member.userId)}
                    onChange={() => toggleMember(member.userId)}
                    disabled={isLoading}
                    className="w-4 h-4 rounded border-input focus:ring-2 focus:ring-ring accent-primary disabled:cursor-not-allowed"
                  />
                  <span className="text-sm text-foreground">
                    {memberNames[member.userId] || `User ID: ${member.userId}`}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {selectedMembers.length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium mb-2 text-foreground">
                Split Type
              </label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={splitType === 'equal' ? 'default' : 'outline'}
                  onClick={() => setSplitType('equal')}
                  disabled={isLoading}
                >
                  Split Equally
                </Button>
                <Button
                  type="button"
                  variant={splitType === 'custom' ? 'default' : 'outline'}
                  onClick={() => setSplitType('custom')}
                  disabled={isLoading}
                >
                  Split Custom
                </Button>
              </div>

              {splitType === 'equal' && (selectedMembers.length > 0) && ( // Only show if members are selected
                <p className="text-sm text-muted-foreground mt-2">
                  Each person will pay: <span className="font-medium text-chart-1">{formatCurrency(amount ? parseFloat(amount) / selectedMembers.length : 0, currency)}</span>
                </p>
              )}

              {splitType === 'custom' && (selectedMembers.length > 0) && (
                <div className="space-y-2 mt-2">
                  {customSplits.map((split) => (
                    <div key={split.userId} className="flex items-center gap-2">
                      <label className="w-1/2 text-sm text-foreground">
                        {memberNames[split.userId] || `User ID: ${split.userId}`}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={split.amount}
                        onChange={(e) => handleCustomSplitChange(split.userId, e.target.value)}
                        disabled={isLoading}
                        className="field-control w-1/2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="0.00"
                      />
                    </div>
                  ))}
                  <p className={`text-sm mt-2 ${remainingAmount < 0 || remainingAmount > 0.01 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    Remaining to split: <span className="font-medium">{formatCurrency(remainingAmount, currency)}</span>
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!description || !amount || !paidBy || selectedMembers.length === 0 || isLoading || (splitType === 'custom' && (remainingAmount < 0 || remainingAmount > 0.01))}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding...
                </span>
              ) : (
                'Add Expense'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
