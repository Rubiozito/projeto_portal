import supertest from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';

import { app } from '../../../src/app';
import { clearDatabase } from '../../../src/shared/database/mock-database';
import { UserRole } from '../../../src/modules/users/user-entity';
import { MockUserRepository } from '../../../src/modules/users/user-repository';

const request = supertest(app);

const OWNER_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const EMPLOYEE_ID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';

afterEach(() => {
  clearDatabase();
});

async function createCompany(domain = 'acme.portal.com'): Promise<string> {
  const repo = new MockUserRepository();
  if (!repo.findById(OWNER_ID)) {
    repo.create({
      id: OWNER_ID,
      name: 'Alice',
      email: 'alice@example.com',
      creationDate: new Date().toISOString(),
      role: UserRole.OWNER,
    });
  }
  const response = await request.post('/company').send({
    companyName: 'Acme Corp',
    customDomain: domain,
    ownerUserId: OWNER_ID,
  });
  return response.body.data.id;
}

describe('PATCH /company/:id', () => {
  it('should return 200 and update only the provided fields', async () => {
    const companyId = await createCompany();

    const response = await request
      .patch(`/company/${companyId}`)
      .send({ companyName: 'Acme Renamed' });

    expect(response.status).toBe(200);
    expect(response.body.data.companyName).toBe('Acme Renamed');
    expect(response.body.data.customDomain).toBe('acme.portal.com');
    expect(response.body.data.ownerUserId).toBe(OWNER_ID);
  });

  it('should return 409 when the new customDomain is taken by another company', async () => {
    await createCompany('acme.portal.com');
    const secondId = await createCompany('beta.portal.com');

    const response = await request
      .patch(`/company/${secondId}`)
      .send({ customDomain: 'acme.portal.com' });

    expect(response.status).toBe(409);
    expect(response.body.message).toBeDefined();
  });

  it('should return 404 when the new ownerUserId does not reference an existing user', async () => {
    const companyId = await createCompany();

    const response = await request
      .patch(`/company/${companyId}`)
      .send({ ownerUserId: 'c3d4e5f6-a7b8-4012-abcd-123456789012' });

    expect(response.status).toBe(404);
    expect(response.body.message).toBeDefined();
  });

  it('should return 400 when the new ownerUserId role is not OWNER', async () => {
    const companyId = await createCompany();

    const repo = new MockUserRepository();
    repo.create({
      id: EMPLOYEE_ID,
      name: 'Bob',
      email: 'bob@example.com',
      creationDate: new Date().toISOString(),
      role: UserRole.EMPLOYEE,
    });

    const response = await request
      .patch(`/company/${companyId}`)
      .send({ ownerUserId: EMPLOYEE_ID });

    expect(response.status).toBe(400);
    expect(response.body.message).toBeDefined();
  });

  it('should return 404 when the company does not exist', async () => {
    const response = await request
      .patch(`/company/${OWNER_ID}`)
      .send({ companyName: 'New Name' });

    expect(response.status).toBe(404);
    expect(response.body.message).toBeDefined();
  });

  it('should return 400 when customDomain is not a valid FQDN', async () => {
    const companyId = await createCompany();

    const response = await request
      .patch(`/company/${companyId}`)
      .send({ customDomain: 'not a valid domain' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBeDefined();
  });

  it('should return 400 when the body is empty', async () => {
    const companyId = await createCompany();

    const response = await request.patch(`/company/${companyId}`).send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBeDefined();
  });
});
