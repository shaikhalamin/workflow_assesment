import { redisConnectionOptions } from './redis.config';

describe('redisConnectionOptions', () => {
  it('converts a Redis URL into BullMQ connection options', () => {
    expect(redisConnectionOptions('redis://redis:6379/2')).toEqual({
      host: 'redis',
      port: 6379,
      db: 2,
    });
  });

  it('preserves Redis credentials from the URL', () => {
    expect(redisConnectionOptions('redis://user:secret@redis:6379')).toEqual({
      host: 'redis',
      port: 6379,
      username: 'user',
      password: 'secret',
    });
  });
});
