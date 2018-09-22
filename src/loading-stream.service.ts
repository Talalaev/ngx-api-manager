import { Injectable } from '@angular/core';
import { BehaviorSubject }    from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';

import { ISApi } from './typings';


@Injectable()
export class LoadingStreamService {
  private loadingSource = new BehaviorSubject<ISApi.loadingAction>({state: false, requestPoint: 'init'});

  public loadingStream$: Observable<ISApi.loadingAction> = this.loadingSource.asObservable();

  emitLoading(action: ISApi.loadingAction) {
    this.loadingSource.next(action);
  }
}

