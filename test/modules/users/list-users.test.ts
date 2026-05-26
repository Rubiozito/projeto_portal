import supertest from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';

import { app } from '../../../src/app';
import { clearDatabase } from '../../../src/shared/database/mock-database';

const request = supertest(app);

afterEach(() => {
  clearDatabase();
});

describe('GET /users', () => {
  it('should return 200 with all users in data array', async () => {
    await request
      .post('/users')
      .send({ name: 'Ana', email: 'ana@example.com', role: 'EMPLOYEE' });
    await request
      .post('/users')
      .send({ name: 'Bob', email: 'bob@example.com', role: 'OWNER' });

    const response = await request.get('/users');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
  });

  it('should return 200 with empty array when no users exist', async () => {
    const response = await request.get('/users');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
  });

  it('should return all fields for each user', async () => {
    await request
      .post('/users')
      .send({ name: 'Carlos', email: 'carlos@example.com', role: 'EXTERNAL' });

    const response = await request.get('/users');

    expect(response.body.data[0]).toMatchObject({
      name: 'Carlos',
      email: 'carlos@example.com',
      role: 'EXTERNAL',
    });
    expect(response.body.data[0].id).toBeDefined();
    expect(response.body.data[0].creationDate).toBeDefined();
  });
});
