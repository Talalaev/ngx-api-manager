import { Injectable } from '@angular/core';

@Injectable()
export class TokenService {
  get: () => string;
  set: (val: string) => string;
  remove: () => void;

  constructor() {
    let token: string|null = null;

    this.get = () => {
      if (token === null) {
        token = localStorage.getItem('token') || null;
      }

      return token;
    };

    this.set = (val: string) => {
      localStorage.setItem('token', val);

      return token = val;
    };

    this.remove = () => {
      localStorage.removeItem('token');
      token = null;
    };
  }
}
