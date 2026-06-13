import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('docker-compose.yml', () => {
  it('checks the backend root endpoint for health', () => {
    const compose = readFileSync(
      join(__dirname, '..', 'docker-compose.yml'),
      'utf8',
    );

    expect(compose).toContain("(process.env.PORT || 8870) + '/'");
    expect(compose).not.toContain("(process.env.PORT || 8870) + '/api'");
  });
});
