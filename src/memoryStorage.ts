/**
 * @desc - Хранилище данных в памяти js. Cохранить устаревшие данные в LocalStorage не получится, так же
 * как и извлечь.
 * */
import { Injectable } from '@angular/core';

import { ISApi } from './typings';


@Injectable()
export class MemoryStorage implements ISApi.Storage {
  get(key) {
    let rawData = this[key];
    if (!rawData) return null;
    let data = MemoryStorage.isFresh(rawData.lastUpdate, rawData.howLongIsItFresh) ? rawData : null;

    // если данные устарели удалим их из хранилища
    if (data === null) this[key] = undefined;

    return data;
  }

  set(key: string, data: ISApi.dataCache) {
    let value = MemoryStorage.isFresh(data.lastUpdate, data.howLongIsItFresh) ? data : null;
    if (value === null) return null;

    this[key] = value;

    return data;
  }

  static isFresh(lastUpdate, howLongIsItFresh) {
    const now: number = Number(+(new Date()));
    const timeAfterLastUpdate = now - lastUpdate;

    return timeAfterLastUpdate < howLongIsItFresh;
  }
}
