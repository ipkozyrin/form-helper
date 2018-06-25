import * as _ from 'lodash';
import { Map } from 'immutable';

import {ErrorMessage} from './Form';
import FormEventData from './interfaces/FormEventData';
import FormState from './interfaces/FormState';
import Storage from './Storage';


// TODO: может быть вложенный
export type Values = { [index: string]: any };
export type FormEventName = 'change' | 'storage' | 'saveStart' | 'saveEnd' | 'submitStart' | 'submitEnd';
export type FormStateName = 'touched' | 'submitting' | 'saving' | 'valid';


export default class FormStorage {
  private readonly storage: Storage;

  constructor(storage: Storage) {
    this.storage = storage;
  }

  getState(stateName: FormStateName): boolean {
    return this.storage.getFormState(stateName);
  }

  /**
   * Get all the combined values of form's fields.
   */
  getCombinedValues(): Values {
    return this.storage.getCombinedValues();
  }

  getEditedValues(): Values {
    const editedValues = {};

    this.storage.eachField((field: Map<string, any>, path: string) => {
      const editedValue: any = field.get('editedValue');

      if (_.isUndefined(editedValue)) return;

      _.set(editedValues, path, editedValue);
    });

    return editedValues;
  }

  getSavedValues(): Values {
    const savedValues = {};

    this.storage.eachField((field: Map<string, any>, path: string) => {
      _.set(savedValues, path, field.get('savedValue'));
    });

    return savedValues;
  }

  getUnSavedValues(): Values {
    const unSavedValues = {};

    this.storage.eachField((field: Map<string, any>, path: string) => {
      const editedValue: any = field.get('editedValue');

      if (_.isUndefined(editedValue) || field.get('savedValue') === editedValue) return;

      // if editedValue has a defined value and it isn't equal to editedValue
      _.set(unSavedValues, path, field.get('editedValue'));
    });

    return unSavedValues;
  }

  getInvalidMessages(): Array<ErrorMessage> {
    const invalidMessages: Array<ErrorMessage> = [];

    this.storage.eachField((field: Map<string, any>, path: string) => {
      const msg: string = field.get('invalidMsg');

      if (msg) {
        invalidMessages.push({
          field: path,
          message: field.get('invalidMsg'),
        });
      }
    });

    return invalidMessages;
  }

  getWholeState(): FormState {
    return {
      ...this.storage.getWholeFormState(),
      values: this.getCombinedValues(),
    };
  }

  setStateSilent(partlyState: FormState): void {
    this.storage.setFormState(partlyState);
  }

  emitStorageEvent(action: string, newState: any, oldState: any, force?: boolean): void {

    // TODO: action - one of - init, update

    if (!force && _.isEqual(oldState, newState)) return;

    const data: FormEventData = {
      target: 'form',
      event: 'storage',
      state: newState,
      oldState,
      action,
    };

    this.emit('storage', data);
  }

  /**
   * Add one or more handlers on form's event:
   * * change - changes of any field made by user
   * * storage - changes of storage
   * * saveStart
   * * saveEnd
   * * submitStart
   * * submitEnd
   * @param eventName
   * @param cb
   */
  on(eventName: FormEventName, cb: (data: FormEventData) => void): void {
    this.storage.events.on(eventName, cb);
  }

  emit(eventName: FormEventName, data: FormEventData): void {
    this.storage.events.emit(eventName, data);
  }

  off(eventName: FormEventName, cb: (data: FormEventData) => void): void {
    this.storage.events.off(eventName, cb);
  }

  destroy(): void {
    this.storage.destroy();
  }

}