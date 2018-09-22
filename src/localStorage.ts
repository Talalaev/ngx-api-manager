/*
* @desc - Хранилище данных в window.localStorage. Cохранить устаревшие данные в LocalStorage не получится, так же
* как и извлечь.
* */
import { Injectable } from '@angular/core';

import { ISApi } from './typings';


@Injectable()
export class LocalStorage implements ISApi.Storage {
  get(key) {
    let rawData = localStorage.getItem(key);
    if (!rawData) return null;

    let data = this._parseDataWithExpirationDate(rawData);

    // если данные устарели удалим их из хранилища
    if (data === null) localStorage.removeItem(key);

    return data;
  }

  set(key, data) {
    let value = this._stringifyDataWithExpirationDate(data);
    if (value === null) return null;

    localStorage.setItem(key, value);

    return data;
  }

  static isFresh(lastUpdate, howLongIsItFresh) {
    const now: number = Number(+(new Date()));
    const timeAfterLastUpdate = now - lastUpdate;

    return timeAfterLastUpdate < howLongIsItFresh;
  }

  private _parseDataWithExpirationDate(data) {
    if (!data) return null;

    let res = JSON.parse(data);
    if (!LocalStorage.isFresh(res.lastUpdate, res.howLongIsItFresh)) {
      return null;
    }

    return res;
  }

  private _stringifyDataWithExpirationDate(data) {
    if (!data) return null;

    if (!LocalStorage.isFresh(data.lastUpdate, data.howLongIsItFresh)) {
      return null;
    }

    return JSON.stringify(data);
  }
}
