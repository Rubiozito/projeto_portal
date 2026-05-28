import { companyDatabase } from '../../shared/database/mock-database';

import { ICompany } from './company-entity';

export interface ICompanyRepository {
  create(company: ICompany): ICompany;
  findById(id: string): ICompany | undefined;
  findByDomain(domain: string): ICompany | undefined;
  findAll(): ICompany[];
  update(id: string, data: Partial<ICompany>): ICompany | undefined;
  delete(id: string): boolean;
}

export class MockCompanyRepository implements ICompanyRepository {
  create(company: ICompany): ICompany {
    companyDatabase.push(company);
    return company;
  }

  findById(id: string): ICompany | undefined {
    return companyDatabase.find((c) => c.id === id);
  }

  findByDomain(domain: string): ICompany | undefined {
    return companyDatabase.find((c) => c.customDomain === domain);
  }

  findAll(): ICompany[] {
    return [...companyDatabase];
  }

  update(id: string, data: Partial<ICompany>): ICompany | undefined {
    const index = companyDatabase.findIndex((c) => c.id === id);
    if (index === -1) return undefined;
    companyDatabase[index] = { ...companyDatabase[index], ...data };
    return companyDatabase[index];
  }

  delete(id: string): boolean {
    const index = companyDatabase.findIndex((c) => c.id === id);
    if (index === -1) return false;
    companyDatabase.splice(index, 1);
    return true;
  }
}
