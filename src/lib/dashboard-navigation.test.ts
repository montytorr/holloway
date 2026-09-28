import test from 'node:test';
import assert from 'node:assert/strict';
import { dashboardDestination } from './dashboard-navigation';

test('delivery health selects its own destination instead of the webhook parent', () => {
  assert.equal(
    dashboardDestination('/webhooks/health')?.label,
    'Delivery health',
  );
  assert.equal(dashboardDestination('/webhooks/register')?.label, 'Webhooks');
});

test('record and task routes keep their owning workspace destination', () => {
  assert.equal(
    dashboardDestination('/contracts/record-id')?.label,
    'Contracts',
  );
  assert.equal(
    dashboardDestination('/projects/project-id/tasks/task-id')?.label,
    'Projects',
  );
  assert.equal(dashboardDestination('/admin/emails')?.label, 'Email templates');
});

test('unknown paths cannot activate a destination through a partial prefix', () => {
  assert.equal(dashboardDestination('/tasks-archive'), undefined);
  assert.equal(dashboardDestination('/unavailable'), undefined);
  assert.equal(dashboardDestination('/')?.label, 'Overview');
});
