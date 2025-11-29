// ==========================
// Re-export các util khác
// ==========================
export * from './uuid.util';
export * from './trace-id.util';
export * from './pagination.util';
export * from './cursor-pagination.util';
export * from './query-optimizer.util';
export * from './random-memorable';

// ==========================
// Các helper function chung
// ==========================
export const convertJsonStringToObject = (stringify: string) => {
  try {
    return JSON.parse(stringify as string);
  } catch {
    return {};
  }
};

export function pLimit(concurrency: number) {
  let active = 0;
  const queue: Array<() => void> = [];

  const next = () => {
    if (active >= concurrency) return;
    const job = queue.shift();
    if (!job) return;
    active++;
    job();
  };

  return <T>(fn: () => Promise<T>) =>
    new Promise<T>((resolve, reject) => {
      const run = () =>
        fn()
          .then(resolve, reject)
          .finally(() => {
            active--;
            next();
          });
      queue.push(run);
      next();
    });
}

// ==========================
// Re-export types cho backward compatibility
// ==========================
export type { IApiResponse as Rsp } from '../interfaces/api-response.interface';
export type { IPaginationMeta as MetaPagination } from '../interfaces/pagination.interface';
export type { IPaginatedResponse as Pagination } from '../interfaces/pagination.interface';
