import supertest from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';

import { app } from '../../../src/app';
import { clearDatabase } from '../../../src/shared/database/mock-database';

const request = supertest(app);

afterEach(() => {
  clearDatabase();
});

async function createDefaultUser(
  overrides: Record<string, unknown> = {},
): Promise<Record<string, unknown>> {
  const res = await request.post('/users').send({
    name: 'Default User',
    email: 'default@example.com',
    role: 'EMPLOYEE',
    ...overrides,
  });
  return res.body.data as Record<string, unknown>;
}

describe('PATCH /users/:id', () => {
  it('should update the name and return 200 with data envelope', async () => {
    const user = await createDefaultUser();
    const response = await request
      .patch(`/users/${user.id}`)
      .send({ name: 'New Name' });

    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe('New Name');
    expect(response.body.data.email).toBe(user.email);
  });

  it('should update the email when not taken by another user', async () => {
    const user = await createDefaultUser();
    const response = await request
      .patch(`/users/${user.id}`)
      .send({ email: 'new@example.com' });

    expect(response.status).toBe(200);
    expect(response.body.data.email).toBe('new@example.com');
  });

  it('should return 409 when new email is already used by another user', async () => {
    await createDefaultUser({ email: 'taken@example.com' });
    const user = await createDefaultUser({
      name: 'Other',
      email: 'other@example.com',
    });
    const response = await request
      .patch(`/users/${user.id}`)
      .send({ email: 'taken@example.com' });

    expect(response.status).toBe(409);
    expect(response.body.message).toBeDefined();
  });

  it('should not change the role even when it is included in the body', async () => {
    const user = await createDefaultUser({ role: 'EMPLOYEE' });
    await request.patch(`/users/${user.id}`).send({ name: 'Updated' });

    const getResponse = await request.get(`/users/${user.id}`);

    expect(getResponse.body.data.role).toBe('EMPLOYEE');
  });

  it('should clear companyId when null is sent', async () => {
    const user = await createDefaultUser({ companyId: 'some-corp' });
    const response = await request
      .patch(`/users/${user.id}`)
      .send({ companyId: null });

    expect(response.status).toBe(200);
    expect(response.body.data.companyId).toBeUndefined();
  });

  it('should return 404 when user does not exist', async () => {
    const response = await request
      .patch('/users/00000000-0000-4000-8000-000000000001')
      .send({ name: 'X' });

    expect(response.status).toBe(404);
    expect(response.body.message).toBeDefined();
  });

  it('should return 400 when body is empty', async () => {
    const user = await createDefaultUser();
    const response = await request.patch(`/users/${user.id}`).send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBeDefined();
  });

  it('should only update provided fields and leave others unchanged', async () => {
    const user = await createDefaultUser({
      companyId: 'corp',
      name: 'Original',
    });
    const response = await request
      .patch(`/users/${user.id}`)
      .send({ name: 'Changed' });

    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe('Changed');
    expect(response.body.data.companyId).toBe('corp');
  });

  it('should return 400 when id is not a valid UUID', async () => {
    const response = await request
      .patch('/users/not-a-uuid')
      .send({ name: 'X' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBeDefined();
  });

  it('should preserve id and creationDate after update', async () => {
    const user = await createDefaultUser();
    const response = await request
      .patch(`/users/${user.id}`)
      .send({ name: 'Updated' });

    expect(response.body.data.id).toBe(user.id);
    expect(response.body.data.creationDate).toBe(user.creationDate);
  });
});
