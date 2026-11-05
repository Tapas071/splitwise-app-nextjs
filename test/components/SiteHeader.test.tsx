import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SiteHeader } from '../../src/components/SiteHeader';

describe('SiteHeader', () => {
  it('shows the signed-in user first name under the profile icon', () => {
    render(<SiteHeader isAuthenticated firstName="Asha" />);

    expect(screen.getByText('Asha')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "Open Asha's profile menu" })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Log in' })).not.toBeInTheDocument();
  });

  it('opens the profile modal from the named profile button', async () => {
    const user = userEvent.setup();
    render(<SiteHeader isAuthenticated firstName="Asha" />);
    await user.click(screen.getByRole('button', { name: "Open Asha's profile menu" }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /account settings/i })).toBeInTheDocument();
  });

  it('shows login and signup links when signed out', () => {
    render(<SiteHeader isAuthenticated={false} />);

    expect(screen.getByRole('link', { name: 'Log in' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /get started/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /profile menu/i })).not.toBeInTheDocument();
  });
});
