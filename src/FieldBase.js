import _ from 'lodash';

import DebouncedCall from './DebouncedCall';

export default class FieldBase {
  constructor(form, fieldName) {
    this.$form = form;
    this.$pathToField = fieldName;
    this.$onChangeCallback = null;
    this.__storage = this.$form.$storage;
    this.__onSaveCallback = null;
    this.__debouncedCall = new DebouncedCall(this.$form.$config.debounceTime);

    this._debouncedCb = undefined;

    // init state
    this.__storage.initFieldState(this.$pathToField, fieldName);
  }

  get userInput() {return this.__storage.getUserInput(this.$pathToField)}
  get outerValue() {return this.__storage.getOuterValue(this.$pathToField)}
  get value() {return this.__storage.getValue(this.$pathToField)}

  get name() {return this.__storage.getFieldState(this.$pathToField, 'name')}
  get dirty() {return this.__storage.getFieldState(this.$pathToField, 'dirty')}
  get touched() {return this.__storage.getFieldState(this.$pathToField, 'touched')}
  get valid() {return this.__storage.getFieldState(this.$pathToField, 'valid')}
  get invalidMsg() {return this.__storage.getFieldState(this.$pathToField, 'invalidMsg')}
  get saving() {return this.__storage.getFieldState(this.$pathToField, 'saving')}
  get focused() {return this.__storage.getFieldState(this.$pathToField, 'focused')}
  get disabled() {return this.__storage.getFieldState(this.$pathToField, 'disabled')}
  get validateRule() {
    return this._validateRule;
    //return this.__storage.getFieldState(this.$pathToField, 'validateRule');
  }
  get debounceTime() {return this.__debouncedCall.delay}

  set value(newOuterValue) {this._hardlySetOuterValue(newOuterValue)}
  set outerValue(newValue) {this.__storage.setOuterValue(this.$pathToField, newValue)}
  set disabled(value) {this.__storage.setFieldState(this.$pathToField, {disabled: value})}
  set validateRule(value) {
    this._validateRule = value;
    //this.__storage.setFieldState(this.$pathToField, 'validateRule', value);
  }
  set debounceTime(delay) {this.__debouncedCall.delay = delay}



  /**
   * Silent update. It uses for set outer(from machine) values (not user's).
   *
   * It does:
   * * It set up new value to self instance and to storage
   * * It updates "dirty" and "valid" states.
   * * It rises anyChange event for field and whole form.
   *
   * It doesn't:
   * * It doesn't rise onChange callback (for user's events).
   * * It doesn't update "touched" state.
   * @param {*} newValue
   */
  _hardlySetOuterValue(newValue) {
    const oldCombinedValue = _.cloneDeep(this.value);

    // set to outer value layer
    this.outerValue = newValue;

    // TODO: тестировать, если нет теста

    // TODO: только если в конфиге разрешенно при focused
    // remove user input if field isn't on focus and set dirty to false
    if (!this.focused) {
      this.__storage.setUserInput(this.$pathToField, undefined);
      //this.__storage.setFieldState(this.$pathToField, {dirty: false});
      this.$form.$handlers.handleFieldDirtyChange(this.$pathToField, false);
    }

    // TODO: тестировать что была перевалидация
    // TODO: проверить тест что было поднято событие

    // re validate and rise events
    if (!_.isEqual(oldCombinedValue, this.value)) {
      this.validate();
      // rise silent change events
      this.$form.$handlers.handleSilentValueChange(this.$pathToField, oldCombinedValue);
    }
  }


  __startSave(force) {
    // don't save invalid value
    if (!this.valid) return;
    if (!this.$form.$handlers.isUnsaved(this.$pathToField)) return;

    if (this.__onSaveCallback) {
      this.__debouncedCall.exec(this.__onSaveCallback, force, this.value);
    }

    this.$form.$handlers.handleFieldSave(force);
  }

  __updateDirty() {
    let newDirtyValue;

    // TODO: зачем такая проверка????
    if (this.userInput === '' && (this.outerValue === '' || _.isNil(this.outerValue))) {
      // 0 compares as common value.
      newDirtyValue = false;
    }
    else {
      // just compare initial value and value
      newDirtyValue = this.userInput !== this.outerValue;
    }

    this.$form.$handlers.handleFieldDirtyChange(this.$pathToField, newDirtyValue);
  }

}
