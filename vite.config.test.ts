// @vitest-environment node

import { describe, expect, it, vi } from 'vitest'
import type { LogErrorOptions, Logger, UserConfig, UserConfigExport } from 'vite'

import viteConfig from './vite.config'

function isPromiseConfig(
  config: UserConfigExport,
): config is Promise<UserConfig> {
  return typeof config === 'object' && config !== null && 'then' in config
}

function getStaticConfig(): UserConfig {
  if (typeof viteConfig === 'function' || isPromiseConfig(viteConfig)) {
    throw new Error('Expected static Vite config')
  }

  return viteConfig
}

function getLogger(): Logger {
  const logger = getStaticConfig().customLogger
  if (!logger) throw new Error('Expected custom Vite logger')

  return logger
}

function proxyErrorOptions(code: string): LogErrorOptions {
  return {
    timestamp: true,
    error: Object.assign(new Error(`read ${code}`), { code }),
  }
}

describe('Vite proxy logging', () => {
  it('does not print socket.io ECONNRESET proxy errors', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    getLogger().error(
      'http proxy error: /socket.io/?EIO=4&transport=polling',
      proxyErrorOptions('ECONNRESET'),
    )

    expect(consoleError).not.toHaveBeenCalled()
    consoleError.mockRestore()
  })

  it('does not print socket.io backend connection failures', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    getLogger().error(
      'http proxy error: /socket.io/?EIO=4&transport=polling',
      proxyErrorOptions('ECONNREFUSED'),
    )

    expect(consoleError).not.toHaveBeenCalled()
    consoleError.mockRestore()
  })

  it('still prints non-socket proxy errors', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    getLogger().error(
      'http proxy error: /api/users',
      proxyErrorOptions('ECONNRESET'),
    )

    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
  })
})
