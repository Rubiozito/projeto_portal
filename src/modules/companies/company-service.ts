import { randomUUID } from 'crypto';

import { BadRequestError } from '../../shared/errors/bad-request-error';
import { DuplicatedItemError } from '../../shared/errors/duplicated-item-error';
import { ForbiddenError } from '../../shared/errors/forbidden-error';
import { NotFoundError } from '../../shared/errors/not-found-error';

import { UserRole } from '../users/user-entity';
import { IUserRepository } from '../users/user-repository';

import { ICompany } from './company-entity';
import { ICompanyRepository } from './company-repository';
import { CreateCompanyInput, UpdateCompanyInput } from './company-schemas';

export class CompanyService {
  constructor(
    private readonly repository: ICompanyRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  createCompany(input: CreateCompanyInput): ICompany {
    const existingDomain = this.repository.findByDomain(input.customDomain);
    if (existingDomain)
      throw new DuplicatedItemError('Domain already registered');

    const owner = this.userRepository.findById(input.ownerUserId);
    if (!owner) throw new NotFoundError('User not found');
    if (owner.role !== UserRole.OWNER)
      throw new BadRequestError('Owner must have role OWNER');

    const company: ICompany = {
      id: randomUUID(),
      companyName: input.companyName,
      customDomain: input.customDomain,
      ownerUserId: input.ownerUserId,
    };

    return this.repository.create(company);
  }

  getCompanyById(id: string): ICompany {
    const company = this.repository.findById(id);
    if (!company) throw new NotFoundError('Company not found');
    return company;
  }

  getAllCompanies(): ICompany[] {
    return this.repository.findAll();
  }

  updateCompany(id: string, input: UpdateCompanyInput): ICompany {
    const company = this.repository.findById(id);
    if (!company) throw new NotFoundError('Company not found');

    if (
      input.customDomain !== undefined &&
      input.customDomain !== company.customDomain
    ) {
      const domainTaken = this.repository.findByDomain(input.customDomain);
      if (domainTaken)
        throw new DuplicatedItemError('Domain already registered');
    }

    if (input.ownerUserId !== undefined) {
      const owner = this.userRepository.findById(input.ownerUserId);
      if (!owner) throw new NotFoundError('User not found');
      if (owner.role !== UserRole.OWNER)
        throw new BadRequestError('Owner must have role OWNER');
    }

    const updated = this.repository.update(id, input);
    if (!updated) throw new NotFoundError('Company not found');
    return updated;
  }

  deleteCompany(id: string, callerId: string): void {
    const company = this.repository.findById(id);
    if (!company) throw new NotFoundError('Company not found');
    if (callerId !== company.ownerUserId) throw new ForbiddenError('Forbidden');

    this.repository.delete(id);

    // Cascade: clear companyId for all users associated with this company
    const allUsers = this.userRepository.findAll();
    allUsers.forEach((user) => {
      if (user.companyId === id) {
        this.userRepository.update(user.id, { companyId: undefined });
      }
    });
  }
}
