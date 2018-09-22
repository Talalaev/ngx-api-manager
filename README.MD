# ngx-api-manager

## Installation

To install this library, run:

```bash
$ npm install ngx-api-manager --save
```

## Для чего?

1. Эмитит событие загрузки с указанием "точки вызова api". Вы имеете единый поток http ошибок.
2. Совершает прерывание запроса по истчению таймаута.
3. Эмит событий ошибки и обработка ошибок по умолчанию.
4. Автоматически устанавливает токен и заголовки. Все повторяющиеся операции автоматизированы.
5. Контролирует работу с api предотвращая обращения к несуществующим url. Проверка существования роута используя типы.

Для выполнения запросов использует конфигурационный файл. В конфигурационном файле указывается домен с которым
должен работать API и список доступных ссылок(роутов).

Один домент = один конфигурационный файл.

## Подлючение

При подключении модуля Api обязательно указывается список конфигураций с которыми будет происходить работа.

```
@NgModule({
  imports: [
    ApiModule.forRoot({
      configs: [new ApiConfig('main'), new ApiCkcConfig('ckc')]
    }),
  ],
  declarations: [],
  exports: []
})
export class PagesModule { }
```

## Использование

Работа с http сервером начинается с изучения документации в которой описаны все возможные роуты. Примером такой документации
сервера может служить swagger документация. ApiConfig описывает список всех возможных роутов в соответсвии с сервеной
документацией используя синтаксис класса.

#### 1. Добавить в конфигурацию требуемые роуты

Допустим сервер предоставляет роуты для работы с двумя видами сущьностей -> `Users` и `Apples` и стандартные CRUD операции.

```
User:
  find
  create
  update
  delete
Apple:
  find
  create
  update
  delete
```

В таком случае конфигурация на фронтенд будет выглядеть следующим образом:

```
class ApiConfig {
  baseUrl: string = 'base url';

  get user {
    return {
      find: '${baseUrl}/User',
      create: '${baseUrl}/User',
      update: '${baseUrl}/User',
      delete: '${baseUrl}/User'
    };
  }

  get apple {
    return {
      find: '${baseUrl}/Apple',
      create: '${baseUrl}/Apple',
      update: '${baseUrl}/Apple',
      delete: '${baseUrl}/Apple'
    };
  }
}
```

Таким образом конфигурация на фронтэнд выглядит и упорядочена так же как и документация предоставленная бэкэндом, что
удобно для поиска.

##### Url с динамическим параметром в середине url

Допустим существует url на удаление пользователя с динамическим параметром `userID` в середине ссылки
`/v1/User/${userID}/cancel`. В таком случае в конфигурации используется стрелочная функция:

```
class ApiConfig {

  get user {
    return {
      find: '${baseUrl}/User',
      cancel: (userID: string) => {
        return `${this.baseUrl}/v1/User/${userID}/cancel`;
      }
    };
  }
}
```

#### 2. Сконфигурировать http запрос

Конфигурирование запроса происходит в два шага: выбор рабочей конфигурации и установка параметров запроса.

```
this.api
  .useConfig<ApiConfig>('main')
  .request(config => ({
    method: 'get',
    url: config.device.all,
    requestPoint: 'devices'
  }));
```

Передача generic типа в функцию `useConfig` обязательна для контролирования обращения к несуществующим url.

Фунция `request` принимает callback возвращающий объект с конфигурацией http запроса.

##### Объект конфигураци

Обязательные значения:

1. `method`
2. `url`
3. `requestPoint` - строка в которой указано откуда был вызван http запрос и по которой можно отфильтровать нужные значения
из потока ошибок и загрузок.

Остальные значения:

4. `param` - подставляется в конце url. `${this.baseUrl}/User/{param}`, например id пользователя.
5. `paramsArray` - массив get параметров. `[{key: 'value', val: 'value'}]`
6. `body` - тело запроса.
7. `timeout` - кастомизирует значение задержки для конкретного запроса. иначе берется из конфигурации.

#### 3. Выполнить запрос

Для выполнения запроса нужно вызвать специальный метод `promise<T>()` с указанием типа возвращаемых данных.

```
this.api
  .useConfig<ApiCkcConfig>('ckc')
  .request(config => ({
    method: 'get',
    url: config.device.all,
    requestPoint: 'devices'
  }))
  .promise<Array<Device>>();
```

##### Получение всех пользователей GET

В `subject` указываем сущьность к которой мы обращаемся. В `just` указываем тип CRUD операции.

```
this.api
  .useConfig<ApiConfig>('main')
  .request(config => ({
    method: 'get',
    url: config.user.find,
    requestPoint: 'userComponent'
  }))
  .promise<Array<User>>();

// обратится к class ApiConfig (когда произойдет вызов запроса) у которого есть свойство user хранящее объект со ссылками
class ApiConfig {
  ...
    get user {
      return {
        find: '${baseUrl}/User',
        create: '${baseUrl}/User',
        update: '${baseUrl}/User',
        delete: '${baseUrl}/User'
      };
    }
  ...
}
```

##### Получение всех пользователей с лимитом не более 10 `limit=10` GET

В `subject` указываем сущьность к которой мы обращаемся. В `just` указываем тип CRUD операции. Для передачи списка get
параметров используется `paramsArray`

```
// '${baseUrl}/User?limit=10'
this.api
  .useConfig<ApiConfig>('main')
  .request(config => ({
    method: 'get',
    url: config.user.find,
    requestPoint: 'userComponent',
    paramsArray: [{key: 'limit', val: '10'}]
  }))
  .promise<Array<User>>();
```

##### Получение пользователя по id GET

Для установки значение `id` в конце url используется специальный параметр `param`.

```
// получение пользователя с id = 2
// '${baseUrl}/User/2
this.api
  .useConfig<ApiConfig>('main')
  .request(config => ({
    method: 'get',
    url: config.user.find,
    requestPoint: 'userComponent',
    param: 2
  }))
  .promise<User>();
```

#### Редактирование пользователя PUTCH

Для редактирования пользователя понадобится передать тело запроса `body`, id пользователя `id` и указать метод `putch`

```
this.api
  .useConfig<ApiConfig>('main')
  .request(config => ({
    method: 'putch',
    url: config.user.update,
    requestPoint: 'userComponent',
    param: 2,
    body: {
      name: 'new Name'
    }
  }))
  .promise<User>();
```

## Выполнение http запроса

После конфигурации запроса не происходит реального запроса по сети. Для этого есть два варианта использования.

```
let editUserRequest = this.api
  .useConfig<ApiConfig>('main')
  .request(config => ({
    method: 'putch',
    url: config.user.update,
    requestPoint: 'userComponent',
    param: 2,
    body: {
      name: 'new Name'
    }
  }))
  .promise<User>();

let putchUser = async () => {
  let putchedUser = await editUserRequest.promise();
};
```

1. Преобразовать запрос к `Promise` -> `editUserRequest.promise()`.
2. Преобразовать запрос к потоку `RxStream` -> `editUserRequest.stream()`.

После преобразования к `Promise` произойдет реальный http запрос.

В случае с преобразованием к потоку `RxStream` запрос произойдет лишь в момент когда кто либо подпишется на данный поток.

## Обработка событий загрузки

Перед отправкой запроса по сети генерируется событие загрузки на потоке `loading` сервис `LoadingService`. По завершению
запроса с ошибкой или без нее генерируется событие завершения загрузки.

Подключиться к потоку `loading` -> `loadingService.loadingStream$`;

```
class SomeClass {
  constructor(
    private loading: LoadingService // Подключаем сервис загрузок
  ) {
    this.loading.loadingStream$ // поток событий згрузки
  }
}
```

Для реакции (обработки) на данные события любой компонент может подписаться на события загрузки и отфитровать только нужные
ему события начала и окончания загрузки. Фильтрация происходи благодаря указанию в момент конфигурирования запроса
специального параметра `requestPoint: "userComponent"`.

В типом данных отправляемых в поток является `action` -> `{state: true, requestPoint: 'some reuest point name'}`

```
import { Component, ViewChild } from '@angular/core';

import { LoadingService } from './loading.service';

@Component({
  selector: 'loading-component',
  templateUrl: 'loading.component.html'
})
export class LoadingComponent implements LoadingComponent {
  @ViewChild('staticModal')
  modal;

  isLoading: boolean = false;

  constructor(
    private loading: LoadingService // Подключаем сервис загрузок
  ) {
    this.loading
      .loadingStream$
      .filter(action => action.requestPoint === "userComponent")
      .subscribe((action) => {
        // обработать событие загрузки для компонента по точке запроса (requestPoint)
        // не используйте патерн с подпиской subscribe
        switch (action.state) {
          case true:
            return this.onStartLoading();
          case false:
            return this.onEndLoading();
        }
      });
  }

  onStartLoading() {
    this.isLoading = true;
    this.modal.show();
  }

  onEndLoading() {
    this.isLoading = false;
    this.modal.hide();
  }
}
```

## Обработка потока ошибок

В случае возникновения ошибки http запроса генерируется событие на потоке `error` сервис `ErrorsService`. Предусмотрена
автоматическая обработка ошибок с выводом уведомлений пользователю в случае ошибоки сервера `error.status >= 500`.

Подключиться к потоку `error` -> `errorsService.errorsStream$`;

В случае возникновения ошибки http запроса автоматически генерируется событие завершения загрузки для данной точки запроса.

```
import { Injectable } from '@angular/core';
import { Subject }    from 'rxjs/Subject';

import { enMsgs } from './errorsMessages/en';

import { LoadingService } from '../loading/loading.service';

@Injectable()
export class ErrorsService {
  private errorSource = new Subject<{error: ErrorObj, errorPoint: string}>();

  errorsStream$ = this.errorSource.asObservable();

  constructor(
    private loading: LoadingService
  ) {}

  emitError(error: ErrorObj, errorPoint) {
    this.loading.emitLoading({state: false, requestPoint: errorPoint});
    this.errorSource.next({error, errorPoint});
  }

  defaultProcessing(e, errorPoint) {
    switch (e.status) {
      case 0:
        return this.emitError(new DisconnectedError(enMsgs['0'], e), errorPoint);
      case 400:
        return this.emitError(new ClientError(enMsgs['400'], e), errorPoint);
      case 401:
      // ... и так далее
    }

    return this.emitError(new UnusualError(enMsgs['unusual'], e), errorPoint);
  }
}
```

Для реакции (обработки) на события ошибко любой компонент может подписаться на поток ошибок и отфильтровать только нужные
ошибки используя специальный параметр указанные в момент конфигурирования запроса `requestPoint: "userComponent"`.
В поток ошибок данный параметр приходит под именем `errorPoint`

В типом данных отправляемых в поток является `action` -> `{error: errorObject, errorPoint: 'some reuest point name'}`

```
import { Component, ViewChild } from '@angular/core';

import { ErrorsService } from './errors.service';

@Component({
  selector: 'errors-component',
  templateUrl: 'errors.component.html',
})
export class ErrorsComponent {
  showLog: boolean = false;
  newError: any = {};
  cause: any = {};

  @ViewChild('staticModal')
  modal;

  constructor(
    private errorsService: ErrorsService
  ) {
    this.errorsService
      .errorsStream$
      .filter(action => action.errorPoint === "userComponent")
      .subscribe((error) => {
        // какая либо обработка ошибки
      });
  }
  ...
}
```

## Итого

1. Добавление новых ссылок к api происходит в `api.config` и любом другом конфиге
2. Метод `request().stream()` из `api.service` возвращает только наблюдаемый объект
`Observable`
3. Внешний код занимается обработкой ошибок, например код сервиса для
конкретного компонента.


## License

MIT © [Mike T.](mailto:ja-morning@yandex.ru)
