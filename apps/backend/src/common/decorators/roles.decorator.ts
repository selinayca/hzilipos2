import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../database/entities/user.entity';

export const ROLES_KEY = 'roles';

/**
 * @Roles(UserRole.TENANT_ADMIN, UserRole.CASHIER)
 *
 * Used together with RolesGuard to restrict endpoint access.
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
