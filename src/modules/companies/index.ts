import { Router } from 'express';

import { MockUserRepository } from '../users/user-repository';

import { MockCompanyRepository } from './company-repository';
import { CompanyService } from './company-service';
import { CompanyController } from './company-controller';

const userRepository = new MockUserRepository();
const companyRepository = new MockCompanyRepository();
const service = new CompanyService(companyRepository, userRepository);
const controller = new CompanyController(service);

export const companiesRouter = Router();

companiesRouter.post('/', controller.createCompany);
companiesRouter.get('/', controller.listCompanies);
companiesRouter.get('/:id', controller.getCompanyById);
companiesRouter.patch('/:id', controller.updateCompany);
companiesRouter.delete('/:id', controller.deleteCompany);
