import axios from 'axios'

export const publicClient = axios.create({
  baseURL: '/api/public',
  timeout: 10_000,
})
