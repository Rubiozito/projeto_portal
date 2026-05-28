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

function setupOwner(): void {
  const repo = new MockUserRepository();
  repo.create({
    id: OWNER_ID,
    name: 'Alice',
    email: 'alice@example.com',
    creationDate: new Date().toISOString(),
    role: UserRole.OWNER,
  });
}

describe('GET /company', () => {
  it('should return 200 with all companies when companies exist', async () => {
    setupOwner();

    await request.post('/company').send({
      companyName: 'Acme Corp',
      customDomain: 'acme.portal.com',
      ownerUserId: OWNER_ID,
    });
    await request.post('/company').send({
      companyName: 'Beta Inc',
      customDomain: 'beta.portal.com',
      ownerUserId: OWNER_ID,
    });

    const response = await request.get('/company');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
  });

  it('should return 200 with an empty array when no companies exist', async () => {
    const response = await request.get('/company');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
  });
});
