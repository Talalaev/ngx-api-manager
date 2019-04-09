/**
 * TODO Добавить в модуль api функцию кеширования данных
 * Есть компоненты которые запрашивают данные при инициализации используя api. При каждом появлении
 * компонента происходит http запрос используя сервис. Нужно для модуля api реализовать возможность кэширования, чтобы
 * при запросе данных сервис выполнял http запрос только в случае если данных нет в хранилище или требуется выполнить
 * обновление данных с http запросом.
 * Для этого в модуль api нужно добавить функцию сохранения данных в хранилище и проверку нужных данных там же.
 * Так же нужно реализовать разные типы хранилищь. Локальное(просто в памяти), LocalStorage и адаптер для Redux.
 *
 * Хранилище redux как и любое другое хранилище должно быть недоступно для редактиорования внешним кодом и хранить
 * состояние данных получаемых по api. Если данные были сохранены на сервер то они должны быть обновлены в хранилище.
 *
 * При каждом get запросе в хранилище создается поле с уникальным значением для этого запроса. Разные сервисы могут
 * выполнять для одного и тогоже роута запросы с разными фильтрами. Для каждого такого запроса должен создаваться
 * отдельный объект. При вызове api.request сервис передает api свое имя которое станет уникальным значением для
 * хранрения и последущего получения данных. Любой сервис может так же пердать параметры указывающие нужно ли
 * кэшировать запрос или нет, нужно ли выполнить обновление данных или получать их из хранилища, а так же указать
 * какое хранилище использовать.
 * */
import { ModuleWithProviders, NgModule } from '@angular/core';
import { HttpClient } from "@angular/common/http";

import { ISApi } from './typings';


import { ApiService, API_CONFIG, API_SERVICE } from './api.service';
import { MemoryStorage } from "./memoryStorage";
import { LocalStorage } from "./localStorage";

import { TokenService } from './token.service';

import { ErrorsStreamService } from './errors-stream.service';
import { LoadingStreamService } from './loading-stream.service';

export * from './api.service';
export * from './token.service';
export * from './errors-stream.service';
export * from './loading-stream.service';

@NgModule({
  providers: [
    HttpClient,
    ApiService,
    TokenService,
    MemoryStorage,
    LocalStorage,
    ErrorsStreamService,
    LoadingStreamService
  ],
  exports: []
})
export class NgxApiManager {
  static forRoot(options: {storages?: ISApi.storages, configs?: Array<ISApi.apiConfig>} = {}): ModuleWithProviders {
    return {
      ngModule: NgxApiManager,
      providers: [
        ...options.configs.map((config: ISApi.apiConfig) => {
          return { provide: API_CONFIG, useValue: config, multi: true };
        }),
        {
          provide: API_SERVICE,
          // не забывайте при передаче в deps сервиса класс является маркером.
          deps: [
            HttpClient, TokenService, ErrorsStreamService,
            LoadingStreamService, API_CONFIG, MemoryStorage, LocalStorage
          ],
          useFactory: (
            httpClient, tokenService, errorsService,
            loadingService, apiConfigs, memoryStorage, localStorage
          ) => {
            let api = new ApiService(
              httpClient,
              tokenService,
              errorsService,
              loadingService,
              apiConfigs
            );
            // пока тестируются функции кэширования используется данное решение.
            // когда storages будут внедрены то подключаться они будут как apiConfigs
            api.storages = {
              ...options.storages,
              ...{
                main: memoryStorage,
                localStorage: localStorage
              }
            };

            return api;
          }
        }
      ]
    };
  }
}
