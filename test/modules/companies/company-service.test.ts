import { beforeEach, describe, expect, it } from 'vitest';

import { clearDatabase } from '../../../src/shared/database/mock-database';
import { UserRole } from '../../../src/modules/users/user-entity';
import { MockUserRepository } from '../../../src/modules/users/user-repository';
import { MockCompanyRepository } from '../../../src/modules/companies/company-repository';
import { CompanyService } from '../../../src/modules/companies/company-service';

const OWNER_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const EMPLOYEE_ID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
const OTHER_ID = 'c3d4e5f6-a7b8-9012-cdef-123456789012';

let companyRepository: MockCompanyRepository;
let userRepository: MockUserRepository;
let service: CompanyService;

beforeEach(() => {
  clearDatabase();
  companyRepository = new MockCompanyRepository();
  userRepository = new MockUserRepository();
  service = new CompanyService(companyRepository, userRepository);
});

function createOwner(): void {
  userRepository.create({
    id: OWNER_ID,
    name: 'Alice',
    email: 'alice@example.com',
    creationDate: new Date().toISOString(),
    role: UserRole.OWNER,
  });
}

// US1 — createCompany
describe('CompanyService.createCompany', () => {
  it('should create a company and return it with a generated id', () => {
    createOwner();

    const result = service.createCompany({
      companyName: 'Acme Corp',
      customDomain: 'acme.portal.com',
      ownerUserId: OWNER_ID,
    });

    expect(result.id).toBeDefined();
    expect(result.companyName).toBe('Acme Corp');
    expect(result.customDomain).toBe('acme.portal.com');
    expect(result.ownerUserId).toBe(OWNER_ID);
  });

  it('should throw DuplicatedItemError when customDomain is already registered', () => {
    createOwner();

    service.createCompany({
      companyName: 'Acme Corp',
      customDomain: 'acme.portal.com',
      ownerUserId: OWNER_ID,
    });

    expect(() =>
      service.createCompany({
        companyName: 'Acme Corp 2',
        customDomain: 'acme.portal.com',
        ownerUserId: OWNER_ID,
      }),
    ).toThrow('Domain already registered');
  });

  it('should throw NotFoundError when ownerUserId does not exist', () => {
    expect(() =>
      service.createCompany({
        companyName: 'Acme Corp',
        customDomain: 'acme.portal.com',
        ownerUserId: OWNER_ID,
      }),
    ).toThrow('User not found');
  });

  it('should throw BadRequestError when ownerUserId references a user whose role is not OWNER', () => {
    userRepository.create({
      id: EMPLOYEE_ID,
      name: 'Bob',
      email: 'bob@example.com',
      creationDate: new Date().toISOString(),
      role: UserRole.EMPLOYEE,
    });

    expect(() =>
      service.createCompany({
        companyName: 'Acme Corp',
        customDomain: 'acme.portal.com',
        ownerUserId: EMPLOYEE_ID,
      }),
    ).toThrow('Owner must have role OWNER');
  });
});

// US2 — getCompanyById
describe('CompanyService.getCompanyById', () => {
  it('should return the company when it exists', () => {
    createOwner();

    const created = service.createCompany({
      companyName: 'Acme Corp',
      customDomain: 'acme.portal.com',
      ownerUserId: OWNER_ID,
    });

    const result = service.getCompanyById(created.id);
    expect(result).toEqual(created);
  });

  it('should throw NotFoundError when company does not exist', () => {
    expect(() => service.getCompanyById(OWNER_ID)).toThrow('Company not found');
  });
});

// US3 — getAllCompanies
describe('CompanyService.getAllCompanies', () => {
  it('should return all companies', () => {
    createOwner();

    service.createCompany({
      companyName: 'Acme Corp',
      customDomain: 'acme.portal.com',
      ownerUserId: OWNER_ID,
    });
    service.createCompany({
      companyName: 'Beta Inc',
      customDomain: 'beta.portal.com',
      ownerUserId: OWNER_ID,
    });

    expect(service.getAllCompanies()).toHaveLength(2);
  });

  it('should return an empty array when no companies exist', () => {
    expect(service.getAllCompanies()).toEqual([]);
  });
});

// US4 — updateCompany
describe('CompanyService.updateCompany', () => {
  it('should update only the provided fields and preserve the others', () => {
    createOwner();

    const created = service.createCompany({
      companyName: 'Acme Corp',
      customDomain: 'acme.portal.com',
      ownerUserId: OWNER_ID,
    });

    const updated = service.updateCompany(created.id, {
      companyName: 'Acme Renamed',
    });

    expect(updated.companyName).toBe('Acme Renamed');
    expect(updated.customDomain).toBe('acme.portal.com');
    expect(updated.ownerUserId).toBe(OWNER_ID);
  });

  it('should throw DuplicatedItemError when the new customDomain is taken by another company', () => {
    createOwner();

    service.createCompany({
      companyName: 'Acme Corp',
      customDomain: 'acme.portal.com',
      ownerUserId: OWNER_ID,
    });
    const second = service.createCompany({
      companyName: 'Beta Inc',
      customDomain: 'beta.portal.com',
      ownerUserId: OWNER_ID,
    });

    expect(() =>
      service.updateCompany(second.id, { customDomain: 'acme.portal.com' }),
    ).toThrow('Domain already registered');
  });

  it('should throw NotFoundError when the new ownerUserId does not exist', () => {
    createOwner();

    const created = service.createCompany({
      companyName: 'Acme Corp',
      customDomain: 'acme.portal.com',
      ownerUserId: OWNER_ID,
    });

    expect(() =>
      service.updateCompany(created.id, { ownerUserId: OTHER_ID }),
    ).toThrow('User not found');
  });

  it('should throw BadRequestError when the new ownerUserId role is not OWNER', () => {
    createOwner();

    userRepository.create({
      id: EMPLOYEE_ID,
      name: 'Bob',
      email: 'bob@example.com',
      creationDate: new Date().toISOString(),
      role: UserRole.EMPLOYEE,
    });

    const created = service.createCompany({
      companyName: 'Acme Corp',
      customDomain: 'acme.portal.com',
      ownerUserId: OWNER_ID,
    });

    expect(() =>
      service.updateCompany(created.id, { ownerUserId: EMPLOYEE_ID }),
    ).toThrow('Owner must have role OWNER');
  });

  it('should throw NotFoundError when the company does not exist', () => {
    expect(() =>
      service.updateCompany(OWNER_ID, { companyName: 'New Name' }),
    ).toThrow('Company not found');
  });
});

// US5 — deleteCompany
describe('CompanyService.deleteCompany', () => {
  it('should delete the company and clear companyId for all associated users', () => {
    createOwner();

    const created = service.createCompany({
      companyName: 'Acme Corp',
      customDomain: 'acme.portal.com',
      ownerUserId: OWNER_ID,
    });

    userRepository.update(OWNER_ID, { companyId: created.id });

    service.deleteCompany(created.id, OWNER_ID);

    expect(() => service.getCompanyById(created.id)).toThrow(
      'Company not found',
    );
    expect(userRepository.findById(OWNER_ID)?.companyId).toBeUndefined();
  });

  it('should throw ForbiddenError when callerId does not match ownerUserId', () => {
    createOwner();

    const created = service.createCompany({
      companyName: 'Acme Corp',
      customDomain: 'acme.portal.com',
      ownerUserId: OWNER_ID,
    });

    expect(() => service.deleteCompany(created.id, OTHER_ID)).toThrow(
      'Forbidden',
    );
  });

  it('should throw NotFoundError when the company does not exist', () => {
    expect(() => service.deleteCompany(OWNER_ID, OTHER_ID)).toThrow(
      'Company not found',
    );
  });
});
