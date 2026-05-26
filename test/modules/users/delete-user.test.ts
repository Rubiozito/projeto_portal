import supertest from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';

import { app } from '../../../src/app';
import { clearDatabase } from '../../../src/shared/database/mock-database';

const request = supertest(app);

afterEach(() => {
  clearDatabase();
});

describe('DELETE /users/:id', () => {
  it('should delete a user and return 204 with no body', async () => {
    const created = await request
      .post('/users')
      .send({ name: 'To Delete', email: 'del@example.com', role: 'OWNER' });
    const id = created.body.data.id;

    const response = await request.delete(`/users/${id}`);

    expect(response.status).toBe(204);
    expect(response.body).toEqual({});
  });

  it('should make the user unreachable after deletion', async () => {
    const created = await request
      .post('/users')
      .send({ name: 'Temp', email: 'temp@example.com', role: 'EMPLOYEE' });
    const id = created.body.data.id;

    await request.delete(`/users/${id}`);

    const getResponse = await request.get(`/users/${id}`);

    expect(getResponse.status).toBe(404);
  });

  it('should return 404 when user does not exist', async () => {
    const response = await request.delete(
      '/users/00000000-0000-4000-8000-000000000001',
    );

    expect(response.status).toBe(404);
    expect(response.body.message).toBeDefined();
  });

  it('should return 400 when id is not a valid UUID', async () => {
    const response = await request.delete('/users/not-a-uuid');

    expect(response.status).toBe(400);
    expect(response.body.message).toBeDefined();
  });
});
