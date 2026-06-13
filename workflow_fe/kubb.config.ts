import { defineConfig } from '@kubb/core'
import { pluginClient } from '@kubb/plugin-client'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginReactQuery } from '@kubb/plugin-react-query'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'

export default defineConfig({
  root: '.',
  input: {
    path: 'http://127.0.0.1:8870/docs-json',
  },
  output: {
    path: './src/lib/api/gen',
    clean: true,
  },
  plugins: [
    pluginOas({ validate: false }),
    pluginTs({
      output: { path: './types' },
      group: { type: 'tag' },
      enumType: 'literal',
      unknownType: 'unknown',
    }),
    pluginZod({
      output: { path: './zod' },
      group: { type: 'tag' },
    }),
    pluginClient({
      output: { path: './clients' },
      importPath: '@/lib/api/client.ts',
      group: { type: 'tag' },
      dataReturnType: 'data',
      paramsType: 'object',
      pathParamsType: 'object',
    }),
    pluginReactQuery({
      output: { path: './hooks' },
      group: { type: 'tag' },
      client: {
        importPath: '@/lib/api/client.ts',
        dataReturnType: 'data',
      },
      paramsType: 'object',
      pathParamsType: 'object',
      query: {
        methods: ['get'],
      },
      mutation: {
        methods: ['post', 'put', 'patch', 'delete'],
      },
      suspense: false,
      infinite: false,
    }),
  ],
})
