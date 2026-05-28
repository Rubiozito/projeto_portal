import supertest from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';

import { app } from '../../../src/app';
import { clearDatabase } from '../../../src/shared/database/mock-database';
import { UserRole } from '../../../src/modules/users/user-entity';
import { MockUserRepository } from '../../../src/modules/users/user-repository';

const request = supertest(app);

const OWNER_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

afterEach(() => {
  clearDatabase();
});

async function createCompany(): Promise<{ id: string }> {
  const repo = new MockUserRepository();
  repo.create({
    id: OWNER_ID,
    name: 'Alice',
    email: 'alice@example.com',
    creationDate: new Date().toISOString(),
    role: UserRole.OWNER,
  });
  const response = await request.post('/company').send({
    companyName: 'Acme Corp',
    customDomain: 'acme.portal.com',
    ownerUserId: OWNER_ID,
  });
  return response.body.data;
}

describe('GET /company/:id', () => {
  it('should return 200 with the full company record when it exists', async () => {
    const created = await createCompany();

    const response = await request.get(`/company/${created.id}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: created.id,
      companyName: 'Acme Corp',
      customDomain: 'acme.portal.com',
      ownerUserId: OWNER_ID,
    });
  });

  it('should return 404 when company does not exist', async () => {
    const response = await request.get(`/company/${OWNER_ID}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBeDefined();
  });

  it('should return 400 when id is not a valid UUID', async () => {
    const response = await request.get('/company/not-a-uuid');

    expect(response.status).toBe(400);
    expect(response.body.message).toBeDefined();
  });
});
