/**
 * @desc - Единый сервис для выполнения HTTP запросов. Конфигурирует запрос - установка url, метода запроса, токена и др.
 *
 * Как применять читайте в Readme.md находящимся в корне модуля или в документации. Как сгенерировать документация
 * описанно в корневом Readme.md
 *
 * Решает следующие основные задачи. Единый поток для http ошибок и фильтрация по "точки вызова api". Совершает
 * прерывание запроса по истчению таймаута. Автоматически устанавливает токен и заголовки, контролирует работу с api
 * предотвращая обращения к несуществующим url на этапе транспиляции.
 *
 * Для выполнения запросов использует конфигурационный файл. В конфигурационном файле указывается домен с которым
 * должен работать API и список доступных ссылок(роутов), а так же другие параметры.
 *
 * Архитектура:
 * 1. В основе модуля лежит идея - сервис получения данных, например данных о погоде, должен только получать данные, но
 * не определять из какого источника будут получены данные. т.е. идея разделения обязанностей 1. конфигурирование
 * конкретного запроса и 2. конфигурирование работы с конкретным api (доменом) в целом.
 * т.е. сервис получает данные по погоде, а откуда он их получит определяется в конфигурации и используя разные
 * конфигурации (config файлы) один и тот же код сервиса сможет загружать данные из разных истоников нечего не зная о них.
 * */
import { Inject, Injectable, InjectionToken } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";

import { ISApi } from './typings';


import { TokenService } from './token.service';
import { LoadingStreamService } from './loading-stream.service';
import { ErrorsStreamService, TimeoutError } from "./errors-stream.service";
import { Observable } from "rxjs/Observable";
import 'rxjs/add/observable/of';

/**
 * Мысли по поводу кеширования запросов:
 *
 * Что у нас есть?
 * Есть метод получающий ключ по которому можно проверить значение в хранилище.
 *
 * У нас есть запросы которые нужно кэшировать, а есть которые нет. т.е. методы.
 * GET запросы мы кэшируем. потому что мы получаем данные
 * POST, PUT, PATCH запросы мы кэшировать не можем так как они изменяют данные
 * итого кэшируются только GET запросы.
 * Нужно иметь глобальный флаг в конфигурации cache
 * а для каждого отдельно взятого запроса нужно иметь возможность
 * в конфиге опциях запроса нужно учесть флаг освежения запроса. если он true то в любом случае выполнить http запрос
 *
 * Нужно поработать с объектом типа storage. Создать ему еидный интерфей. продумать переключение между разными
 * хранилищами.
 *
 * У нас много хранилищь и конфигураций. При декларировании провайдера мы должны определить как именно будет создаваться
 * экземпляр класса ApiService и сделать это таким образом, чтоб эземпляру были переданы все нужные конфигурации путей
 * http и все возможные типы хранилищь из которых api.service сможет доставать данные.
 * Для обращения к хранилищу используем метод lookInStorage который посмотрит в конфигурации имя хранилища к которому
 * нужно обратиться за данными и выполнит обращение. Полученные данные вернет наружу.
 *
 * Если мы кэшируем какой лиюо get запрос то может возникнуть ситуация когда POST запросом или PATCH запросом данные
 * были изменены. В данной ситуации в кэше окажутся устаревшие данные. Нужно предусмотреть стратегию которая решит
 * данную проблему.
 * */

export const API_CONFIG = new InjectionToken("ApiConfig");
export const API_SERVICE = new InjectionToken("ApiService2");

@Injectable()
export class ApiService {
  protected _defaultField: string = 'main';
  public storages: ISApi.storages;
  public configs: ISApi.configs;

  constructor(
    private http: HttpClient,
    private token: TokenService,
    private errors: ErrorsStreamService,
    private loading: LoadingStreamService,
    @Inject(API_CONFIG) public apiConfigs
  ) {}

  /**
   * @desc - получить конфигурацию по имени
   * */
  public getConfig<T>(name: string): T {
    let config = this.apiConfigs.filter(config => config.name === name);
    return config.length != 0 ? config[0] : {};
  }

  /**
   * @desc - Задает конфигурацию которая будет использована для выполнения http запроса. Любой http запрос начинается с
   * этого метода.
   * */
  public useConfig<T>(name: string) {
    let config = this.apiConfigs.filter(config => config.name === name)[0];
    return {
      /**
       * request обертка над request2 позволяющая контролировать тип используемой конфигурации. см. request2
       * */
      request: (cb: (config: T) => ISApi.apiRequestOptions<HttpHeaders, HttpParams>) => {
        try {
          let requestConfig = cb(config);
          requestConfig.useConfig = config.name;
          return this.request2(requestConfig);
        } catch(e) {
          console.error(e);
        }
      }
    };
  }

  /**
   * @desc - конфигурирует http запрос. устанавливает url, заголовки, токен параметры и т.д.
   * */
  private request2(apiOptions: ISApi.apiRequestOptions<HttpHeaders, HttpParams>) {
    // TODO предусмотреть переменную имяКонфига для экземпляра класса api (this.useConfig)
    const
      token: string = this.token.get(),
      config: ISApi.apiConfig = this.getConfig(apiOptions.useConfig ? apiOptions.useConfig : this._defaultField);
    let
      { method, subject, just, param, paramsArray = [] } = apiOptions;
    let
      httpParams: HttpParams = new HttpParams(),
      headers: HttpHeaders = new HttpHeaders({
        // 'Content-Type': 'application/json'
      });

    apiOptions.url = apiOptions.url ? apiOptions.url : config[subject][just];
    apiOptions.url = param ? `${apiOptions.url}/${param}` : apiOptions.url;
    apiOptions.timeout = apiOptions.timeout ? apiOptions.timeout : config.timeout;
    apiOptions.cache = apiOptions.cache !== undefined ? apiOptions.cache : config.cache;
    apiOptions.forcedRefresh = apiOptions.forcedRefresh !== undefined ? apiOptions.forcedRefresh : config.forcedRefresh;

    // метод get закодирует в encodeURI url включая правильную кодировку знаков "+"
    if (method.toLocaleLowerCase() === 'get') {
      apiOptions.url = this.encodeURL(apiOptions.url, paramsArray, config);
    } else {
      if (token) {
        httpParams = httpParams.set(config.tokenFieldName, token);
      }
      if (paramsArray) {
        paramsArray.forEach((item) => httpParams = httpParams.set(item.key, String(item.val)));
      }
    }

    apiOptions.requestOptions = {
      headers,
      withCredentials: config.withCredentials,
      params: httpParams
    };

    return this.doRequest(apiOptions);
  }

  /**
   * @desc - определяет какой метод (get, post и т.д.) нужно вызывать исходя из конфигурации
   * */
  private doRequest(apiOptions: ISApi.apiRequestOptions<HttpHeaders, HttpParams>) {
    let { url, method, requestOptions, body } = apiOptions;

    switch (method.toLocaleLowerCase()) {
      case 'get':
        return this.getStartLoadingWrapper(this.http.get(url, requestOptions), apiOptions);
      // return this.http.get(url, options);
      case 'post':
        return this.getStartLoadingWrapper(this.http.post(url, body, requestOptions), apiOptions);
      // return this.http.post(url, body, options);
      case 'put':
        return this.getStartLoadingWrapper(this.http.put(url, body, requestOptions), apiOptions);
      // return this.http.put(url, body, options);
      case 'patch':
        return this.getStartLoadingWrapper(this.http.patch(url, body, requestOptions), apiOptions);
      // return this.http.patch(url, body, options);
      case 'delete':
        return this.getStartLoadingWrapper(this.http.delete(url, requestOptions), apiOptions);
      // return this.http.delete(url, options);
    }
  }

  /**
   * @desc - навешивает на http запрос функции общие для любого запроса. Генерация потока ошибок, потока загрузок
   * и таймаут запроса. Сюда можно добавить кэширование, повторные запросы при неудаче и др.
   * */
  private getStartLoadingWrapper(request, apiOptions: ISApi.apiRequestOptions<HttpHeaders, HttpParams>) {
    let { requestPoint = 'global', timeout, method, forcedRefresh } = apiOptions;

    return {

      stream: <T>(): Observable<T> => {
        return request
          .do(d => this.loading.emitLoading({state: true, requestPoint}))
          .timeout(timeout)
          .catch((e) => {
            this.errors.defaultProcessing(e, requestPoint);
            if (e.name === "TimeoutError") throw new TimeoutError(`timeout ${timeout} expired`, e);
            return Observable.of(e);
          })
          .finally(() => this.loading.emitLoading({state: false, requestPoint}));
      },

      promise: async <T>(): Promise<T> => {
        // let cache = this.checkConditionsAndGetCache(apiOptions);
        // if (cache !== null) return cache;

        this.loading.emitLoading({state: true, requestPoint});
        try {
          const res = await Promise.race([
            request.toPromise(),
            new Promise((res, rej) => {
              setTimeout(() => rej(new TimeoutError(`timeout ${timeout} expired`)), timeout)
            })
          ]);
          this.loading.emitLoading({state: false, requestPoint});
          // тут возвращаемое значение может быть закэшировоно

          return res;
        } catch(e) {
          this.loading.emitLoading({state: false, requestPoint});
          this.errors.defaultProcessing(e, requestPoint);
          throw e;
        }
      }

    };
  }

  /**
   * @desc - закодирует параметры get запроса. !!знак '+' нужно кодировать отдельно иначе возникнет ошибка!!
   * */
  private encodeURL(url: string, paramsArray, config: ISApi.apiConfig): string {
    const token: string = this.token.get();

    url = `${url}?${config.tokenFieldName}=${token}`;
    for (let item of paramsArray) {
      let param = encodeURI(`${item.key}=${item.val}`);
      url = `${url}&${param}`;
    }
    url = url.replace(/\+/g, '%2B');

    return url;
  }



  // !!!! Все что ниже не используется. В стадии разработки.

  /**
   * @desc - проверяет уловия при которых можно отдавать закэшированное значение и если уловия верны возвращает кэш.
   * */
  private checkConditionsAndGetCache(apiOptions: ISApi.apiRequestOptions<HttpHeaders, HttpParams>) {
    const config: ISApi.apiConfig = this.configs[apiOptions.useConfig ? apiOptions.useConfig : this._defaultField];
    let { url, requestOptions, method, forcedRefresh } = apiOptions;

    if (forcedRefresh === false) {
      let cacheValue = this.lookInStorage(
        this.getKey(url, requestOptions.params, [config.tokenFieldName])
      );

      if (method === 'get' && cacheValue) return cacheValue;
    }

    return null;
  }

  /**
   * @desc - Для обращения к хранилищу используем метод lookInStorage который посмотрит в конфигурации имя хранилища
   * к которому нужно обратиться за данными и выполнит обращение. Полученные данные вернет наружу.
   * */
  private lookInStorage(key: string, storage: string = this._defaultField) {
    return this.storages[storage].get(key);
  }

  /**
   * @desc - Используя базовый url и набор GET параметров запроса формирует имя ключа для сохранения и получения
   * закэшированных данных для данного url.
   * */
  private getKey<T extends {[key: string]: any}>(baseURL: string, params: T, exclude: Array<string> = []): string {
    let cloneParams: T = null, finallyParams: string;
    for (let param of exclude) cloneParams = params.delete(param);
    finallyParams = cloneParams ? cloneParams.toString() : params.toString();

    return `${baseURL}${finallyParams ? "?" + finallyParams : ""}`;
  }
}
