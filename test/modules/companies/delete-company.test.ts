import supertest from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';

import { app } from '../../../src/app';
import { clearDatabase } from '../../../src/shared/database/mock-database';
import { UserRole } from '../../../src/modules/users/user-entity';
import { MockUserRepository } from '../../../src/modules/users/user-repository';

const request = supertest(app);

const OWNER_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const EMPLOYEE_ID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
const OTHER_ID = 'c3d4e5f6-a7b8-4012-abcd-123456789012';

afterEach(() => {
  clearDatabase();
});

async function createCompany(): Promise<string> {
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
  return response.body.data.id;
}

describe('DELETE /company/:id', () => {
  it('should return 204 when the owner deletes the company', async () => {
    const companyId = await createCompany();

    const response = await request
      .delete(`/company/${companyId}`)
      .send({ callerId: OWNER_ID });

    expect(response.status).toBe(204);
  });

  it('should clear companyId for all associated users after deletion', async () => {
    const companyId = await createCompany();

    const repo = new MockUserRepository();
    repo.create({
      id: EMPLOYEE_ID,
      name: 'Bob',
      email: 'bob@example.com',
      creationDate: new Date().toISOString(),
      role: UserRole.EMPLOYEE,
      companyId,
    });

    await request.delete(`/company/${companyId}`).send({ callerId: OWNER_ID });

    const userResponse = await request.get(`/users/${EMPLOYEE_ID}`);
    expect(userResponse.body.data.companyId).toBeUndefined();
  });

  it('should return 403 when callerId is not the owner', async () => {
    const companyId = await createCompany();

    const response = await request
      .delete(`/company/${companyId}`)
      .send({ callerId: OTHER_ID });

    expect(response.status).toBe(403);
    expect(response.body.message).toBeDefined();
  });

  it('should return 404 when company does not exist', async () => {
    const response = await request
      .delete(`/company/${OWNER_ID}`)
      .send({ callerId: OTHER_ID });

    expect(response.status).toBe(404);
    expect(response.body.message).toBeDefined();
  });

  it('should return 400 when callerId is not a valid UUID', async () => {
    const companyId = await createCompany();

    const response = await request
      .delete(`/company/${companyId}`)
      .send({ callerId: 'not-a-uuid' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBeDefined();
  });
});
