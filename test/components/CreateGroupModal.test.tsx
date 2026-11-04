import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateGroupModal } from '../../src/components/CreateGroupModal';

const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mockRefresh }) }));

beforeEach(() => {
  mockRefresh.mockReset();
  global.fetch = jest.fn();
});

describe('CreateGroupModal', () => {
  it('requires a group name before enabling submission', async () => {
    const user = userEvent.setup();
    render(<CreateGroupModal token="token" />);
    await user.click(screen.getByRole('button', { name: 'Create New Group' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('button', { name: 'Create Group' })).toBeDisabled();
    await user.type(within(dialog).getByLabelText('Group Name'), 'Weekend trip');
    expect(within(dialog).getByRole('button', { name: 'Create Group' })).toBeEnabled();
  });

  it('creates a group and refreshes the dashboard', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: jest.fn() });
    render(<CreateGroupModal token="token" />);
    await user.click(screen.getByRole('button', { name: 'Create New Group' }));
    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByLabelText('Group Name'), 'Weekend trip');
    await user.click(within(dialog).getByRole('button', { name: 'Create Group' }));

    expect(global.fetch).toHaveBeenCalledWith('/api/groups', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ Authorization: 'Bearer token' }),
      body: JSON.stringify({ name: 'Weekend trip' }),
    }));
    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows a useful error when the API rejects group creation', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({ message: 'Group name is already taken' }),
    });
    render(<CreateGroupModal token="token" />);
    await user.click(screen.getByRole('button', { name: 'Create New Group' }));
    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByLabelText('Group Name'), 'Weekend trip');
    await user.click(within(dialog).getByRole('button', { name: 'Create Group' }));

    expect(await within(dialog).findByText('Group name is already taken')).toBeInTheDocument();
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
