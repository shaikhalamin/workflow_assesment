/* eslint-disable @typescript-eslint/no-unused-vars */
import type { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'

import { privateClient } from '@/lib/http/private-client'

export type RequestConfig<TData = unknown> = {
  baseURL?: string
  url?: string
  method?: 'GET' | 'PUT' | 'PATCH' | 'POST' | 'DELETE' | 'OPTIONS' | 'HEAD'
  params?: unknown
  data?: TData | FormData
  responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream'
  signal?: AbortSignal
  validateStatus?: (status: number) => boolean
  headers?: AxiosRequestConfig['headers']
  paramsSerializer?: AxiosRequestConfig['paramsSerializer']
}

export type ResponseConfig<TData = unknown> = {
  data: TData
  status: number
  statusText: string
  headers: AxiosResponse['headers']
}

export type ResponseErrorConfig<TError = unknown> = AxiosError<TError>

export type Client = <
  TResponseData,
  _TError = unknown,
  TRequestData = unknown,
>(
  config: RequestConfig<TRequestData>,
) => Promise<ResponseConfig<TResponseData>>

export const client = async <
  TResponseData,
  _TError = unknown,
  TRequestData = unknown,
>(
  config: RequestConfig<TRequestData>,
) => {
  return privateClient.request<
    TResponseData,
    ResponseConfig<TResponseData>,
    TRequestData
  >(config as AxiosRequestConfig<TRequestData>)
}

export default client
