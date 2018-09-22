import { Injectable } from '@angular/core';
import { Subject }    from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';

import { enMsgs } from './errorsMessages/en';
import { ISApi } from './typings';


@Injectable()
export class ErrorsStreamService {
  private errorSource = new Subject<{error: ISApi.ErrorObj, errorPoint: string}>();

  public errorsStream$: Observable<{error: ISApi.ErrorObj, errorPoint: string}> = this.errorSource.asObservable();

  emitError(error: ISApi.ErrorObj, errorPoint) {
    this.errorSource.next({error, errorPoint});
  }

  defaultProcessing(e, errorPoint) {
    switch (e.status) {
      case 0:
        return this.emitError(new DisconnectedError(enMsgs['0'], e), errorPoint);
      case 400:
        return this.emitError(new ClientError(enMsgs['400'], e), errorPoint);
      case 401:
        return this.emitError(new ClientError(enMsgs['401'], e), errorPoint);
      case 402:
        return this.emitError(new ClientError(enMsgs['402'], e), errorPoint);
      case 403:
        return this.emitError(new ClientError(enMsgs['403'], e), errorPoint);
      case 404:
        return this.emitError(new ClientError(enMsgs['404'], e), errorPoint);
      case 405:
        return this.emitError(new ClientError(enMsgs['405'], e), errorPoint);
      case 406:
        return this.emitError(new ClientError(enMsgs['406'], e), errorPoint);
      case 407:
        return this.emitError(new ClientError(enMsgs['407'], e), errorPoint);
      case 408:
        return this.emitError(new ClientError(enMsgs['408'], e), errorPoint);
      case 409:
        return this.emitError(new ClientError(enMsgs['409'], e), errorPoint);
      case 410:
        return this.emitError(new ClientError(enMsgs['410'], e), errorPoint);
      case 411:
        return this.emitError(new ClientError(enMsgs['411'], e), errorPoint);
      case 412:
        return this.emitError(new ClientError(enMsgs['412'], e), errorPoint);
      case 413:
        return this.emitError(new ClientError(enMsgs['413'], e), errorPoint);
      case 414:
        return this.emitError(new ClientError(enMsgs['414'], e), errorPoint);
      case 415:
        return this.emitError(new ClientError(enMsgs['415'], e), errorPoint);
      case 416:
        return this.emitError(new ClientError(enMsgs['416'], e), errorPoint);
      case 417:
        return this.emitError(new ClientError(enMsgs['417'], e), errorPoint);
      case 422:
        return this.emitError(new ClientError(enMsgs['422'], e), errorPoint);
      case 423:
        return this.emitError(new ClientError(enMsgs['423'], e), errorPoint);
      case 424:
        return this.emitError(new ClientError(enMsgs['424'], e), errorPoint);
      case 425:
        return this.emitError(new ClientError(enMsgs['425'], e), errorPoint);
      case 426:
        return this.emitError(new ClientError(enMsgs['426'], e), errorPoint);
      case 428:
        return this.emitError(new ClientError(enMsgs['428'], e), errorPoint);
      case 429:
        return this.emitError(new ClientError(enMsgs['429'], e), errorPoint);
      case 431:
        return this.emitError(new ClientError(enMsgs['431'], e), errorPoint);
      case 444:
        return this.emitError(new ClientError(enMsgs['444'], e), errorPoint);
      case 449:
        return this.emitError(new ClientError(enMsgs['449'], e), errorPoint);
      case 451:
        return this.emitError(new ClientError(enMsgs['451'], e), errorPoint);
      case 500:
        return this.emitError(new ServerError(enMsgs['500'], e), errorPoint);
      case 501:
        return this.emitError(new ServerError(enMsgs['501'], e), errorPoint);
      case 502:
        return this.emitError(new ServerError(enMsgs['502'], e), errorPoint);
      case 503:
        return this.emitError(new ServerError(enMsgs['503'], e), errorPoint);
      case 504:
        return this.emitError(new ServerError(enMsgs['504'], e), errorPoint);
      case 505:
        return this.emitError(new ServerError(enMsgs['505'], e), errorPoint);
      case 506:
        return this.emitError(new ServerError(enMsgs['506'], e), errorPoint);
      case 507:
        return this.emitError(new ServerError(enMsgs['507'], e), errorPoint);
      case 508:
        return this.emitError(new ServerError(enMsgs['508'], e), errorPoint);
      case 509:
        return this.emitError(new ServerError(enMsgs['509'], e), errorPoint);
      case 510:
        return this.emitError(new ServerError(enMsgs['510'], e), errorPoint);
      case 511:
        return this.emitError(new ServerError(enMsgs['511'], e), errorPoint);
      case 520:
        return this.emitError(new ServerError(enMsgs['520'], e), errorPoint);
      case 521:
        return this.emitError(new ServerError(enMsgs['521'], e), errorPoint);
      case 522:
        return this.emitError(new ServerError(enMsgs['522'], e), errorPoint);
      case 523:
        return this.emitError(new ServerError(enMsgs['523'], e), errorPoint);
      case 524:
        return this.emitError(new ServerError(enMsgs['524'], e), errorPoint);
      case 525:
        return this.emitError(new ServerError(enMsgs['525'], e), errorPoint);
      case 526:
        return this.emitError(new ServerError(enMsgs['526'], e), errorPoint);
    }

    return this.emitError(new UnusualError(enMsgs['unusual'], e), errorPoint);
  }
}

export class TypeError implements ISApi.ErrorObj {
  message: string;
  cause: Error;
  name: string;
  stack: string;

  constructor(type, message, cause) {
    this.message = message;
    this.cause = cause;
    this.name = type;
    this.stack = cause.stack;
  }
}

export class AuthError extends TypeError {
  constructor(message, cause) {
    super('AuthError', message, cause);
  }
}

export class ClientError extends TypeError {
  constructor(message, cause) {
    super('ClientError', message, cause);
  }
}

export class ServerError extends TypeError {
  constructor(message, cause) {
    super('ServerError', message, cause);
  }
}

export class DisconnectedError extends TypeError {
  constructor(message, cause) {
    super('DisconnectedError', message, cause);
  }
}

export class UnusualError extends TypeError {
  constructor(message, cause) {
    super('UnusualError', message, cause);
  }
}

export class TimeoutError extends TypeError {
  status: number;

  constructor(message, cause = {}) {
    super('TimeoutError', message, cause);
    this.status = 408;
  }
}
