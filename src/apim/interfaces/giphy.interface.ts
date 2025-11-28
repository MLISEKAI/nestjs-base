export type GiphyResponse<T = any> = {
  data: T[];
  pagination: PaginationGiphyObject;
  meta: MetaGiphyObject;
};

export type MetaGiphyObject = {
  msg: string;
  status: number;
  response_id: string;
};
export type PaginationGiphyObject = {
  count: number;
  total_count: number;
  offset: number;
};
