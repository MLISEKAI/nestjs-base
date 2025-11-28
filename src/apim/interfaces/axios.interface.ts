export interface AxiosRes<T = any> {
  statusCode: number | 500;
  body: T | null;
  headers?: any;
}

export type Get = {
  _url?: string;
  _path?: string;
  _param?: object;
  _headers?: any;
};
export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type Post = Get & {
  _body?: object;
  _contentType?: 'application/json' | 'application/x-www-form-urlencoded';
};

export interface AxiosInterface {
  post(data: Post): Promise<AxiosRes>;
  put(data: Post): Promise<AxiosRes>;
  get(data: Get): Promise<AxiosRes>;
  delete(data: Post): Promise<AxiosRes>;
}
