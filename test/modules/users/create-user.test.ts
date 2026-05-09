import supertest from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { app } from '../../../src/app';
import { clearDatabase } from '../../../src/shared/database/mock-database';

const request = supertest(app);

const validBody = {
  email: 'rafael@email.com',
  name: 'Rafael Silva',
  role: 'Admin',
  startDate: '2026-01-15T08:00:00Z',
  status: 'ACTIVE',
};

afterEach(() => {
  clearDatabase();
});

describe('POST /users', () => {
  describe('sucesso', () => {
    it('retorna 201 e { message: "User created" } com body válido', async () => {
      const response = await request.post('/users').send(validBody);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ message: 'User created' });
    });

    it('persiste o usuário e o segundo cadastro com email diferente também funciona', async () => {
      await request.post('/users').send(validBody);

      const response = await request
        .post('/users')
        .send({ ...validBody, email: 'outro@email.com' });

      expect(response.status).toBe(201);
    });
  });

  describe('erro 400 - Bad Request', () => {
    it('retorna 400 quando o email é inválido', async () => {
      const response = await request
        .post('/users')
        .send({ ...validBody, email: 'nao-e-um-email' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('retorna 400 quando o name está vazio', async () => {
      const response = await request
        .post('/users')
        .send({ ...validBody, name: '' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('retorna 400 quando o role é inválido', async () => {
      const response = await request
        .post('/users')
        .send({ ...validBody, role: 'SuperAdmin' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('retorna 400 quando o startDate não é uma data ISO 8601 válida', async () => {
      const response = await request
        .post('/users')
        .send({ ...validBody, startDate: '15-01-2026' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('retorna 400 quando o status é inválido', async () => {
      const response = await request
        .post('/users')
        .send({ ...validBody, status: 'PENDING' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('retorna 400 quando campos obrigatórios estão ausentes', async () => {
      const response = await request.post('/users').send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('erro 409 - Conflict', () => {
    it('retorna 409 quando o email já está cadastrado', async () => {
      await request.post('/users').send(validBody);

      const response = await request.post('/users').send(validBody);

      expect(response.status).toBe(409);
      expect(response.body).toEqual({ message: 'Email already in use' });
    });

    it('retorna 409 mesmo com name diferente se o email for o mesmo', async () => {
      await request.post('/users').send(validBody);

      const response = await request
        .post('/users')
        .send({ ...validBody, name: 'Outro Nome' });

      expect(response.status).toBe(409);
    });
  });
});
