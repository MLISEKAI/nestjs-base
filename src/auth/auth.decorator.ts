import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ClientAuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { UserBasicRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

export function AuthClient() {
  return UseGuards(ClientAuthGuard);
}

export function AuthClientWithRoles(roles?: UserBasicRole[]) {
  return applyDecorators(
    UseGuards(ClientAuthGuard, RolesGuard),
    ...(roles ? [SetMetadata(ROLES_KEY, roles)] : []),
  );
}
