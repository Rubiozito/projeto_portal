import { Request, Response } from 'express';

import {
  CreateCompanySchema,
  DeleteCompanySchema,
  UpdateCompanySchema,
  UuidParamSchema,
} from './company-schemas';
import { CompanyService } from './company-service';

export class CompanyController {
  constructor(private readonly service: CompanyService) {}

  createCompany = async (req: Request, res: Response): Promise<void> => {
    const input = CreateCompanySchema.parse(req.body);
    const company = this.service.createCompany(input);
    res.status(201).json({ data: company });
  };

  getCompanyById = async (req: Request, res: Response): Promise<void> => {
    const { id } = UuidParamSchema.parse(req.params);
    const company = this.service.getCompanyById(id);
    res.status(200).json({ data: company });
  };

  listCompanies = async (_req: Request, res: Response): Promise<void> => {
    const companies = this.service.getAllCompanies();
    res.status(200).json({ data: companies });
  };

  updateCompany = async (req: Request, res: Response): Promise<void> => {
    const { id } = UuidParamSchema.parse(req.params);
    const input = UpdateCompanySchema.parse(req.body);
    const company = this.service.updateCompany(id, input);
    res.status(200).json({ data: company });
  };

  deleteCompany = async (req: Request, res: Response): Promise<void> => {
    const { id } = UuidParamSchema.parse(req.params);
    const { callerId } = DeleteCompanySchema.parse(req.body);
    this.service.deleteCompany(id, callerId);
    res.status(204).send();
  };
}
