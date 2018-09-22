export declare namespace ISApi {
  interface apiRequestOptions<Heareds, Params> {
    url?: string,
    method?: string,
    subject?: string,
    just?: string,
    requestPoint?: string,
    param?: string|number,
    paramsArray?: {key: string, val: string}[],
    body?: {}
    timeout?: number,
    cache?: boolean,
    forcedRefresh?: boolean,
    requestOptions?: {
      headers?: Heareds,
      reportProgress?: boolean,
      params?: Params,
      responseType?: any,
      withCredentials?: boolean
    },
    useConfig?: string,
    useStorage?: string
  }

  interface apiConfig {
    name: string,
    prefix: string,
    tokenFieldName: string,
    timeout: number,
    withCredentials: boolean,
    baseUrl: string,
    cache: boolean,
    forcedRefresh: boolean,
    [key: string]: any
  }

  interface dataCache {
    howLongIsItFresh: number,
    lastUpdate: number,
    data: Array<any>,
    params?: {[key: string]: string}
  }

  interface storages {
    main: ISApi.Storage,
    [key: string]: ISApi.Storage
  }

  interface configs {
    main: ISApi.apiConfig,
    [key: string]: ISApi.apiConfig
  }

  abstract class Storage {
    get(key: string): dataCache;
    set(key: string, data: string|dataCache): dataCache;
    static isFresh(lastUpdate: number, howLongIsItFresh: number): boolean;
  }

  interface loadingAction {
    state: boolean,
    requestPoint: string
  }

  interface ErrorObj {
    message: string;
    cause?: Error;
    name: string;
    stack?: string;
  }
}

interface Filter {
  where?: {[k: string]: any},
  fields?: string[],
  include?: {[k: string]: any}|string,
  limit?: number,
  order?: string|string[],
  skip?: number
}
