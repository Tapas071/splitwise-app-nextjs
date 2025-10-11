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
import { createExpense } from '@/app/action';
import { useRouter } from 'next/navigation';

interface Member {
  id: string;
  userId: string;
}

interface AddExpenseModalProps {
  members: Member[];
  groupId: string;
  memberNames: { [key: string]: string };
  token: string;
}

export const AddExpenseModal = ({ members, groupId, memberNames, token }: AddExpenseModalProps) => {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Calculate split amount
      const totalAmount = parseFloat(amount);
      const splitAmount = totalAmount / selectedMembers.length;

      const expenseData = {
        groupId,
        description,
        amount: totalAmount,
        paidById: paidBy,
        splitAmong: selectedMembers.map(userId => ({
          userId,
          amount: splitAmount
        }))
      };

      await createExpense(expenseData, token);

      // Reset form
      setDescription('');
      setAmount('');
      setPaidBy('');
      setSelectedMembers([]);
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
    setSelectedMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="mt-6 w-full">Add Expense</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-popover border-border">
        <DialogHeader>
          <DialogTitle className="text-popover-foreground">Add New Expense</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Create a new expense and split it among group members.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md text-sm">
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
              className="w-full px-3 py-2 bg-background text-foreground border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="e.g., Dinner at restaurant"
            />
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium mb-2 text-foreground">
              Amount ($)
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
              className="w-full px-3 py-2 bg-background text-foreground border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="w-full px-3 py-2 bg-background text-foreground border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            <label className="block text-sm font-medium mb-2 text-foreground">
              Split Among
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-input rounded-md p-3 bg-muted">
              {members.map((member) => (
                <label
                  key={member.id}
                  className={`flex items-center space-x-2 cursor-pointer hover:bg-accent p-2 rounded transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
            {selectedMembers.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Each person will pay: <span className="font-medium text-chart-1">${amount ? (parseFloat(amount) / selectedMembers.length).toFixed(2) : '0.00'}</span>
              </p>
            )}
          </div>

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
              disabled={!description || !amount || !paidBy || selectedMembers.length === 0 || isLoading}
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