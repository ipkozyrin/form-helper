import * as _ from 'lodash';
import {ErrorMessage} from './Form';
import EventData from './interfaces/EventData';


export type FromEventName = 'change' | 'storage' | 'saveStart' | 'saveEnd' | 'submitStart' | 'submitEnd';


export default class FormStorage {
  constructor(storage) {
    this._storage = storage;
  }

  getState(stateName) {
    return this._storage.getFormState(stateName);
  }

  /**
   * Get all the combined values of form's fields.
   */
  getCombinedValues() {
    return this._storage.getCombinedValues();
  }

  getEditedValues() {
    const editedValues = {};

    this._storage.eachField((field, path) => {
      const editedValue = field.get('editedValue');
      if (_.isUndefined(editedValue)) return;
      _.set(editedValues, path, editedValue);
    });

    return editedValues;
  }

  getSavedValues() {
    const savedValues = {};

    this._storage.eachField((field, path) => {
      _.set(savedValues, path, field.get('savedValue'));
    });

    return savedValues;
  }

  getUnSavedValues() {
    const unSavedValues = {};

    this._storage.eachField((field, path) => {
      const editedValue = field.get('editedValue');
      if (_.isUndefined(editedValue) || field.get('savedValue') === editedValue) return;
      // if editedValue has a defined value and it isn't equal to editedValue
      _.set(unSavedValues, path, field.get('editedValue'));
    });

    return unSavedValues;
  }

  getInvalidMessages(): Array<ErrorMessage> {
    const invalidMessages: Array<ErrorMessage> = [];

    this._storage.eachField((field, path) => {
      const msg = field.get('invalidMsg');

      if (msg) {
        invalidMessages.push({
          field: path,
          message: field.get('invalidMsg'),
        });
      }
    });

    return invalidMessages;
  }

  getWholeState() {
    return {
      ...this._storage.getWholeFormState(),
      values: this.getCombinedValues(),
    };
  }

  setStateSilent(partlyState) {
    this._storage.setFormState(partlyState);
  }

  emitStorageEvent(action: string, newState: any, oldState: any, force?: boolean) {
    if (!force && _.isEqual(oldState, newState)) return;

    const data: EventData = {
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
  on(eventName: FromEventName, cb: (data: EventData) => void) {
    this._storage.events.on(eventName, cb);
  }

  emit(eventName: FromEventName, data) {
    this._storage.events.emit(eventName, data);
  }

  off(eventName: FromEventName, cb: (data: EventData) => void) {
    this._storage.events.off(eventName, cb);
  }

  destroy() {
    this._storage.destroy();
  }

}
