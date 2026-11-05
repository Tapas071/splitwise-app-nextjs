import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowseGroupsDialog } from '../../src/components/BrowseGroupsDialog';

const mockRefresh = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

const groups = [
  { id: 'group-1', name: 'Weekend Trip', currency: 'INR' },
  { id: 'group-2', name: 'Office Lunch', currency: 'USD' },
  { id: 'group-3', name: 'Family Weekend', currency: 'INR' },
];

beforeEach(() => {
  mockRefresh.mockReset();
  global.fetch = jest.fn();
});

describe('BrowseGroupsDialog', () => {
  it('keeps the available groups hidden until the browse button is clicked', () => {
    render(<BrowseGroupsDialog groups={groups} userId="user-1" />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /browse groups/i })).toHaveTextContent('3');
  });

  it('shows available groups and their currencies when opened', async () => {
    const user = userEvent.setup();
    render(<BrowseGroupsDialog groups={groups} userId="user-1" />);
    await user.click(screen.getByRole('button', { name: /browse groups/i }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Weekend Trip')).toBeInTheDocument();
    expect(within(dialog).getByText('Office Lunch')).toBeInTheDocument();
    expect(within(dialog).getAllByText(/Currency/)).toHaveLength(3);
    expect(within(dialog).getAllByText(/Currency/)[0]).toHaveTextContent('Public · Currency INR');
    expect(within(dialog).getByText(/3\s+groups\s+found/)).toBeInTheDocument();
  });

  it('filters group names case-insensitively and displays an empty state', async () => {
    const user = userEvent.setup();
    render(<BrowseGroupsDialog groups={groups} userId="user-1" />);
    await user.click(screen.getByRole('button', { name: /browse groups/i }));
    const search = screen.getByRole('searchbox', { name: 'Search groups by name' });
    await user.type(search, 'wEEKEND');
    expect(screen.getByText(/2\s+groups\s+found/)).toBeInTheDocument();
    expect(screen.getByText('Weekend Trip')).toBeInTheDocument();
    expect(screen.getByText('Family Weekend')).toBeInTheDocument();
    expect(screen.queryByText('Office Lunch')).not.toBeInTheDocument();
    await user.clear(search);
    await user.type(search, 'not here');
    expect(screen.getByText('No groups found')).toBeInTheDocument();
  });

  it('shows the empty state when there are no available groups', async () => {
    const user = userEvent.setup();
    render(<BrowseGroupsDialog groups={[]} userId="user-1" />);
    await user.click(screen.getByRole('button', { name: /browse groups/i }));
    expect(screen.getByText(/0\s+groups\s+found/)).toBeInTheDocument();
    expect(screen.getByText('No groups found')).toBeInTheDocument();
  });

  it('sends a join request and refreshes the dashboard', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: jest.fn() });
    render(<BrowseGroupsDialog groups={groups} userId="user-1" />);
    await user.click(screen.getByRole('button', { name: /browse groups/i }));
    await user.click(within(screen.getByRole('dialog')).getAllByRole('button', { name: /request/i })[0]);

    expect(global.fetch).toHaveBeenCalledWith('/api/groups/group-1/member', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'join' }),
    });
    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Your join request was sent');
    expect(within(screen.getByRole('dialog')).getAllByRole('button', { name: /requested/i })).toHaveLength(1);
  });

  it('keeps the dialog open and shows the API error when joining fails', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({ error: 'Already a member' }),
    });
    render(<BrowseGroupsDialog groups={groups} userId="user-1" />);
    await user.click(screen.getByRole('button', { name: /browse groups/i }));
    await user.click(within(screen.getByRole('dialog')).getAllByRole('button', { name: /request/i })[0]);

    expect(await screen.findByRole('alert')).toHaveTextContent('Already a member');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
