import { z } from 'zod';

const FQDN_REGEX =
  /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

export const CreateCompanySchema = z.object({
  companyName: z.string().min(1).trim(),
  customDomain: z.string().regex(FQDN_REGEX).toLowerCase(),
  ownerUserId: z.uuid(),
});

const UpdateCompanyBaseSchema = z.object({
  companyName: z.string().min(1).trim(),
  customDomain: z.string().regex(FQDN_REGEX).toLowerCase(),
  ownerUserId: z.uuid(),
});

export const UpdateCompanySchema = UpdateCompanyBaseSchema.partial().refine(
  (data) => Object.values(data).some((v) => v !== undefined),
  { message: 'At least one field must be provided' },
);

export const DeleteCompanySchema = z.object({
  callerId: z.string().uuid(),
});

export const UuidParamSchema = z.object({
  id: z.string().uuid(),
});

const UpdateCompanyPartialSchema = UpdateCompanyBaseSchema.partial();

export type CreateCompanyInput = z.infer<typeof CreateCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof UpdateCompanyPartialSchema>;
export type DeleteCompanyInput = z.infer<typeof DeleteCompanySchema>;
