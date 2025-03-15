import { AxiosInstance } from 'axios'

declare module '@/services/api' {
  const api: AxiosInstance
  export { api }
  export default api
}
