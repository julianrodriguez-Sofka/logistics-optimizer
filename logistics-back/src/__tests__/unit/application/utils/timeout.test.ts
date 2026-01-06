import { withTimeout, TimeoutError } from '../../../../application/utils/timeout';

describe('withTimeout', () => {
  it('should resolve promise when it completes before timeout', async () => {
    const fastPromise = new Promise<string>(resolve => {
      setTimeout(() => resolve('success'), 100);
    });

    const result = await withTimeout(fastPromise, 1000);
    
    expect(result).toBe('success');
  });

  it('should reject with TimeoutError when promise exceeds timeout', async () => {
    const slowPromise = new Promise<string>(resolve => {
      setTimeout(() => resolve('too late'), 2000);
    });

    await expect(withTimeout(slowPromise, 100)).rejects.toThrow('Operation timed out after 100ms');
  });

  it('should reject with original error if promise rejects before timeout', async () => {
    const failingPromise = Promise.reject(new Error('Network error'));

    await expect(withTimeout(failingPromise, 1000)).rejects.toThrow('Network error');
  });

  it('should handle timeout of 0ms with slow promise', async () => {
    const promise = new Promise(resolve => setTimeout(() => resolve('too late'), 100));

    await expect(withTimeout(promise, 0)).rejects.toThrow('Operation timed out after 0ms');
  });

  it('should resolve immediately if promise is already resolved', async () => {
    const resolvedPromise = Promise.resolve(42);

    const result = await withTimeout(resolvedPromise, 1000);
    
    expect(result).toBe(42);
  });
});
