import supertest from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';

import { app } from '../../../src/app';
import { clearDatabase } from '../../../src/shared/database/mock-database';

const request = supertest(app);

afterEach(() => {
  clearDatabase();
});

describe('POST /users', () => {
  it('should return 201 with data envelope when request is valid', async () => {
    const response = await request.post('/users').send({
      name: 'Rafael Silva',
      email: 'rafael@example.com',
      role: 'OWNER',
    });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      name: 'Rafael Silva',
      email: 'rafael@example.com',
      role: 'OWNER',
    });
    expect(response.body.data.id).toBeDefined();
    expect(response.body.data.creationDate).toBeDefined();
  });

  it('should return 409 when email is already registered', async () => {
    await request
      .post('/users')
      .send({ name: 'First', email: 'dup@example.com', role: 'EMPLOYEE' });
    const response = await request
      .post('/users')
      .send({ name: 'Second', email: 'dup@example.com', role: 'OWNER' });

    expect(response.status).toBe(409);
    expect(response.body.message).toBeDefined();
  });

  it('should return 400 when a mandatory field is missing', async () => {
    const response = await request.post('/users').send({ name: 'No Email' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBeDefined();
  });

  it('should return 400 when role is invalid', async () => {
    const response = await request
      .post('/users')
      .send({ name: 'User', email: 'u@example.com', role: 'ADMIN' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBeDefined();
  });

  it('should include companyId in response when provided', async () => {
    const response = await request.post('/users').send({
      name: 'Owner',
      email: 'owner@example.com',
      role: 'OWNER',
      companyId: 'acme-corp',
    });

    expect(response.status).toBe(201);
    expect(response.body.data.companyId).toBe('acme-corp');
  });

  it('should omit companyId from response when not provided', async () => {
    const response = await request
      .post('/users')
      .send({ name: 'Worker', email: 'worker@example.com', role: 'EMPLOYEE' });

    expect(response.status).toBe(201);
    expect(response.body.data.companyId).toBeUndefined();
  });

  it('should normalize email to lowercase', async () => {
    const response = await request
      .post('/users')
      .send({ name: 'User', email: 'USER@EXAMPLE.COM', role: 'OWNER' });

    expect(response.status).toBe(201);
    expect(response.body.data.email).toBe('user@example.com');
  });

  it('should treat emails case-insensitively for duplicate check', async () => {
    await request
      .post('/users')
      .send({ name: 'First', email: 'test@example.com', role: 'OWNER' });
    const response = await request
      .post('/users')
      .send({ name: 'Second', email: 'TEST@EXAMPLE.COM', role: 'EMPLOYEE' });

    expect(response.status).toBe(409);
  });
});
