import supertest from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';

import { app } from '../../../src/app';
import { clearDatabase } from '../../../src/shared/database/mock-database';

const request = supertest(app);

afterEach(() => {
  clearDatabase();
});

describe('GET /users/:id', () => {
  it('should return 200 with data envelope when user exists', async () => {
    const created = await request
      .post('/users')
      .send({ name: 'Ana', email: 'ana@example.com', role: 'EXTERNAL' });
    const id = created.body.data.id;

    const response = await request.get(`/users/${id}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id,
      name: 'Ana',
      email: 'ana@example.com',
      role: 'EXTERNAL',
    });
    expect(response.body.data.creationDate).toBeDefined();
  });

  it('should return 404 when user does not exist', async () => {
    const response = await request.get(
      '/users/00000000-0000-4000-8000-000000000001',
    );

    expect(response.status).toBe(404);
    expect(response.body.message).toBeDefined();
  });

  it('should return 400 when id is not a valid UUID', async () => {
    const response = await request.get('/users/not-a-uuid');

    expect(response.status).toBe(400);
    expect(response.body.message).toBeDefined();
  });

  it('should return 400 when id is a malformed UUID', async () => {
    const response = await request.get(
      '/users/12345678-1234-1234-1234-12345678',
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toBeDefined();
  });

  it('should return 400 when id is a plain number string', async () => {
    const response = await request.get('/users/42');

    expect(response.status).toBe(400);
    expect(response.body.message).toBeDefined();
  });
});
