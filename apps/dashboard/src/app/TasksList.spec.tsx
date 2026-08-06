import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { TasksList } from './TasksList';

jest.mock('./register-scds', () => ({}));

describe('TasksList', () => {
  it('mounts scds-multi-column-list with items/columns set as DOM properties when tasks load ok', () => {
    const { container } = render(<TasksList tasks={{ status: 'ok', data: ['Renew your ID', 'Update your address'] }} />);

    const list = container.querySelector('scds-multi-column-list') as unknown as {
      items: unknown[];
      columns: { id: string; header: string }[];
    };
    expect(list).not.toBeNull();
    expect(list.items).toEqual(['Renew your ID', 'Update your address']);
    expect(list.columns).toEqual([expect.objectContaining({ id: 'task', header: 'Task' })]);
  });

  it('shows an alert when tasks are unavailable', () => {
    render(<TasksList tasks={{ status: 'unavailable' }} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Tasks are temporarily unavailable.');
  });

  it('renders no list or alert while tasks are still null', () => {
    const { container } = render(<TasksList tasks={null} />);

    expect(container.querySelector('scds-multi-column-list')).toBeNull();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
