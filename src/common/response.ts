export interface Rsp<T> {
  error: boolean
  code: number
  message: string
  data: T | null
  traceId: string
}

export interface MetaPagination {
  item_count: number
  total_items: number
  items_per_page: number
  total_pages: number
  current_page: number
}

export interface Pagination<T> {
  items: T[]
  meta: MetaPagination
}

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

export function generateTraceId(length = 10): string {
  let id = ''
  for (let i = 0; i < length; i++) id += alphabet[Math.floor(Math.random() * alphabet.length)]
  return id
}