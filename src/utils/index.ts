export * from './random-memorable';

export const convertJsonStringToObject = (stringify: string) => {
  try {
    const result = JSON.parse(stringify as string);
    return result;
  } catch (error: any) {
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
