import { IActions } from './action.interface';

export interface IRoles {
  roles: IRole[];
}

export interface IRole {
  name: string;
  actions: IActions;
}