import { Prisma } from '@prisma/client';

export type UserAuthRequest = Prisma.ResUserGetPayload<{
  include: {};
}>;
