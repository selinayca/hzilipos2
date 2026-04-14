import { Tenant } from '../database/entities/tenant.entity';

declare global {
  namespace Express {
    interface Request {
      tenant?: Tenant;
    }
  }
}
