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

function createOwner(): void {
  const repo = new MockUserRepository();
  repo.create({
    id: OWNER_ID,
    name: 'Alice',
    email: 'alice@example.com',
    creationDate: new Date().toISOString(),
    role: UserRole.OWNER,
  });
}

describe('POST /company', () => {
  it('should return 201 with data envelope when request is valid', async () => {
    createOwner();

    const response = await request.post('/company').send({
      companyName: 'Acme Corp',
      customDomain: 'acme.portal.com',
      ownerUserId: OWNER_ID,
    });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      companyName: 'Acme Corp',
      customDomain: 'acme.portal.com',
      ownerUserId: OWNER_ID,
    });
    expect(response.body.data.id).toBeDefined();
  });

  it('should return 409 when customDomain is already registered', async () => {
    createOwner();

    await request.post('/company').send({
      companyName: 'Acme Corp',
      customDomain: 'acme.portal.com',
      ownerUserId: OWNER_ID,
    });

    const response = await request.post('/company').send({
      companyName: 'Acme Corp 2',
      customDomain: 'acme.portal.com',
      ownerUserId: OWNER_ID,
    });

    expect(response.status).toBe(409);
    expect(response.body.message).toBeDefined();
  });

  it('should return 404 when ownerUserId does not reference an existing user', async () => {
    const response = await request.post('/company').send({
      companyName: 'Acme Corp',
      customDomain: 'acme.portal.com',
      ownerUserId: OWNER_ID,
    });

    expect(response.status).toBe(404);
    expect(response.body.message).toBeDefined();
  });

  it('should return 400 when a mandatory field is missing', async () => {
    const response = await request.post('/company').send({
      companyName: 'Acme Corp',
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBeDefined();
  });

  it('should return 400 when customDomain is not a valid FQDN', async () => {
    createOwner();

    const response = await request.post('/company').send({
      companyName: 'Acme Corp',
      customDomain: 'not a valid domain',
      ownerUserId: OWNER_ID,
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBeDefined();
  });

  it('should return 400 when ownerUserId references a user whose role is not OWNER', async () => {
    const repo = new MockUserRepository();
    repo.create({
      id: EMPLOYEE_ID,
      name: 'Bob',
      email: 'bob@example.com',
      creationDate: new Date().toISOString(),
      role: UserRole.EMPLOYEE,
    });

    const response = await request.post('/company').send({
      companyName: 'Acme Corp',
      customDomain: 'acme.portal.com',
      ownerUserId: EMPLOYEE_ID,
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBeDefined();
  });
});
