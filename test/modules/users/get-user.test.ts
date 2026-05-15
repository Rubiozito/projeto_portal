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

describe('GET /users/:id', () => {
  describe('200 - sucesso', () => {
    it('retorna 200 e todos os atributos do usuário quando o id existe', async () => {
      const created = await request.post('/users').send(validBody);
      expect(created.status).toBe(201);

      const createResponse = await request.post('/users').send({
        ...validBody,
        email: 'outro@email.com',
      });
      expect(createResponse.status).toBe(201);

      // busca o id via criação direta na base para garantir o UUID
      const { database } =
        await import('../../../src/shared/database/mock-database');
      const userId = database[0]!.id;

      const response = await request.get(`/users/${userId}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: userId,
        email: validBody.email,
        name: validBody.name,
        role: validBody.role,
        status: validBody.status,
      });
      expect(response.body).toHaveProperty('startDate');
    });
  });

  describe('400 - Bad Request (UUID inválido)', () => {
    it('retorna 400 quando o id é uma string arbitrária', async () => {
      const response = await request.get('/users/abc');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('retorna 400 quando o id é um número como string', async () => {
      const response = await request.get('/users/42');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('retorna 400 quando o id é um UUID malformado', async () => {
      const response = await request.get(
        '/users/12345678-1234-1234-1234-12345678',
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('404 - Not Found', () => {
    it('retorna 404 quando o UUID é válido mas não existe na base', async () => {
      const response = await request.get(
        '/users/00000000-0000-0000-0000-000000000000',
      );

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'User not found' });
    });

    it('retorna 404 após deletar todos os usuários da base', async () => {
      await request.post('/users').send(validBody);

      const { database } =
        await import('../../../src/shared/database/mock-database');
      const userId = database[0]!.id;

      clearDatabase();

      const response = await request.get(`/users/${userId}`);

      expect(response.status).toBe(404);
    });
  });
});
