import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddExpenseModal } from '../../src/components/AddExpenseModal';

const mockRefresh = jest.fn();
const members = [
  { id: 'membership-1', userId: 'user-1' },
  { id: 'membership-2', userId: 'user-2' },
];
const memberNames = { 'user-1': 'Alice', 'user-2': 'Bob' };

jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mockRefresh }) }));

beforeEach(() => {
  mockRefresh.mockReset();
  global.fetch = jest.fn();
});

describe('AddExpenseModal', () => {
  it('shows the group currency and computes equal shares', async () => {
    const user = userEvent.setup();
    render(<AddExpenseModal members={members} groupId="group-1" memberNames={memberNames} token="token" currency="INR" />);
    await user.click(screen.getByRole('button', { name: 'Add Expense' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByLabelText('Amount (INR)')).toBeInTheDocument();
    await user.type(within(dialog).getByLabelText('Description'), 'Dinner');
    await user.type(within(dialog).getByLabelText('Amount (INR)'), '100');
    await user.selectOptions(within(dialog).getByLabelText('Paid By'), 'user-1');
    await user.click(within(dialog).getByRole('checkbox', { name: 'Alice' }));
    await user.click(within(dialog).getByRole('checkbox', { name: 'Bob' }));

    expect(within(dialog).getByText(/Each person will pay:/)).toHaveTextContent('₹50.00');
    expect(within(dialog).getByRole('button', { name: 'Add Expense' })).toBeEnabled();
  });

  it('submits equal split amounts and refreshes the group view', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: jest.fn() });
    render(<AddExpenseModal members={members} groupId="group-1" memberNames={memberNames} token="secret" currency="INR" />);
    await user.click(screen.getByRole('button', { name: 'Add Expense' }));
    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByLabelText('Description'), 'Dinner');
    await user.type(within(dialog).getByLabelText('Amount (INR)'), '100');
    await user.selectOptions(within(dialog).getByLabelText('Paid By'), 'user-1');
    await user.click(within(dialog).getByRole('checkbox', { name: 'Alice' }));
    await user.click(within(dialog).getByRole('checkbox', { name: 'Bob' }));
    await user.click(within(dialog).getByRole('button', { name: 'Add Expense' }));

    expect(global.fetch).toHaveBeenCalledWith('/api/expenses', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ Authorization: 'Bearer secret' }),
      body: JSON.stringify({
        groupId: 'group-1', description: 'Dinner', amount: 100, paidById: 'user-1',
        splitAmong: [{ userId: 'user-1', amount: 50 }, { userId: 'user-2', amount: 50 }],
      }),
    }));
    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not allow an incomplete custom split', async () => {
    const user = userEvent.setup();
    render(<AddExpenseModal members={members} groupId="group-1" memberNames={memberNames} token="token" />);
    await user.click(screen.getByRole('button', { name: 'Add Expense' }));
    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByLabelText('Description'), 'Dinner');
    await user.type(within(dialog).getByLabelText('Amount (INR)'), '100');
    await user.selectOptions(within(dialog).getByLabelText('Paid By'), 'user-1');
    await user.click(within(dialog).getByRole('checkbox', { name: 'Alice' }));
    await user.click(within(dialog).getByRole('checkbox', { name: 'Bob' }));
    await user.click(within(dialog).getByRole('button', { name: 'Split Custom' }));

    expect(within(dialog).getByText(/Remaining to split:/)).toHaveTextContent('₹100.00');
    expect(within(dialog).getByRole('button', { name: 'Add Expense' })).toBeDisabled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('displays the API error if expense creation fails', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({ message: 'Split validation failed' }),
    });
    render(<AddExpenseModal members={members} groupId="group-1" memberNames={memberNames} token="token" />);
    await user.click(screen.getByRole('button', { name: 'Add Expense' }));
    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByLabelText('Description'), 'Dinner');
    await user.type(within(dialog).getByLabelText('Amount (INR)'), '100');
    await user.selectOptions(within(dialog).getByLabelText('Paid By'), 'user-1');
    await user.click(within(dialog).getByRole('checkbox', { name: 'Alice' }));
    await user.click(within(dialog).getByRole('button', { name: 'Add Expense' }));

    expect(await within(dialog).findByText('Split validation failed')).toBeInTheDocument();
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
