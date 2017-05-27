import _ from 'lodash';

import DebouncedCall from './DebouncedCall';


export default class Field {
  constructor(form, fieldName) {
    // TODO: protected props rename to __prop
    this.$form = form;
    this.$pathToField = fieldName;
    this.$onChangeCallback = null;
    this.__storage = this.$form.$storage;
    this.__onSaveCallback = null;
    this.__debouncedCall = new DebouncedCall(this.$form.$config.debounceTime);

    this._debouncedCb = undefined;
    this._validateCb = undefined;

    // init state
    // TODO: !!!! this.$pathToField и fieldName = одно и то же
    this.__storage.initFieldState(this.$pathToField, fieldName);
  }

  get form() {
    return this.$form;
  }
  // TODO: ?? может тоже переименовать в inputValue
  get userInput() {
    return this.__storage.getUserInput(this.$pathToField);
  }
  // TODO: переименовать в fixedValue / savedValue / prevStateValue
  get outerValue() {
    return this.__storage.getOuterValue(this.$pathToField);
  }
  // combined value
  get value() {
    return this.__storage.getValue(this.$pathToField);
  }
  get name() {
    return this.__storage.getFieldState(this.$pathToField, 'name');
  }
  get dirty() {
    return this.__storage.getFieldState(this.$pathToField, 'dirty');
  }
  get touched() {
    return this.__storage.getFieldState(this.$pathToField, 'touched');
  }
  get valid() {
    return this.__storage.getFieldState(this.$pathToField, 'valid');
  }
  get invalidMsg() {
    return this.__storage.getFieldState(this.$pathToField, 'invalidMsg');
  }
  get saving() {
    return this.__storage.getFieldState(this.$pathToField, 'saving');
  }
  get focused() {
    return this.__storage.getFieldState(this.$pathToField, 'focused');
  }
  get disabled() {
    return this.__storage.getFieldState(this.$pathToField, 'disabled');
  }
  get validateCb() {
    return this._validateCb;
  }
  get debounceTime() {
    return this.__debouncedCall.delay;
  }

  // set outer value with clearing user input
  setValue(newOuterValue) {
    // TODO: может переименовать в setFixedValue?
    // TODO: !!!! WTF??!!
    this._hardlySetOuterValue(newOuterValue);
  }
  setDisabled(value) {
    this.__storage.setFieldState(this.$pathToField, { disabled: value });
  }
  setValidateCb(value) {
    this._validateCb = value;
  }
  setDebounceTime(delay) {
    this.__debouncedCall.delay = delay;
  }


  // TODO: WTF??? наверное это setFixedValueSilent ???
  $setOuterValue(newValue) {
    this.__storage.setOuterValue(this.$pathToField, newValue);
  }

  /**
   * Recalculate dirty state.
   */
  $recalcDirty() {
    let newDirtyValue;

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

  /**
   * Start saving field and form in they have a save handlers.
   * It will reset saving in progress before start saving.
   * @param {boolean} force
   *   * if true it will save immediately.
   *   * if false it will save with dobounce delay
   * @private
   */
  __startSave(force) {
    // don't save invalid value
    if (!this.valid) return;
    // TODO: ??? for what???
    // don't save already saved value
    if (!this.$form.$handlers.isUnsaved(this.$pathToField)) return;

    // rise a field's save callback
    if (this.__onSaveCallback) {
      // TODO: может надо сначала сбросить текущее сохранение если оно идёт?
      // TODO: должно подняться собитие save этого поля
      this.__debouncedCall.exec(this.__onSaveCallback, force, this.value);
    }
    // TODO: может надо сначала сбросить текущее сохранение если оно идёт?
    // TODO: должно подняться собитие save формы
    // rise form's save callback
    this.$form.$handlers.handleFieldSave(force);
  }

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
    // TODO: !!!! rename
    // TODO: !!!! review

    const oldCombinedValue = _.cloneDeep(this.value);

    // set to outer value layer
    this.$setOuterValue(newValue);

    // remove user input if field isn't on focus and set dirty to false.
    // of course if it allows in config.
    if (this.$form.$config.allowFocusedFieldUpdating || (!this.$form.$config.allowFocusedFieldUpdating && !this.focused)) {
      this.__storage.setUserInput(this.$pathToField, undefined);
      this.$form.$handlers.handleFieldDirtyChange(this.$pathToField, false);
    }

    // re validate and rise events
    if (!_.isEqual(oldCombinedValue, this.value)) {
      this.validate();
      // rise silent change events
      this.$form.$handlers.handleSilentValueChange(this.$pathToField, oldCombinedValue);
    }
  }


  /**
   * It's an onChange handler. It must be placed to input onChange attribute.
   * It sets a new user's value and start saving.
   * It does:
   * * don't do anything if field is disabled
   * * don't save if value isn't changed
   * * update userInput value
   * * update "touched" and "dirty" states
   * * validate
   * * Rise a "change" events for field and form
   * * Run an onChange callback if it assigned.
   * * Start saving
   * @param {*} newValue
   */
  handleChange(newValue) {
     // don't do anything if disabled
    if (this.disabled) return;

    const oldCombinedValue = _.cloneDeep(this.value);

    // don't save unchanged value if it allows in config.
    if (!this.$form.$config.unchangedValueSaving && _.isEqual(oldCombinedValue, newValue)) return;

    this.__storage.setUserInput(this.$pathToField, newValue);
    // set touched to true
    if (!this.touched) this.$form.$handlers.handleFieldStateChange(this.$pathToField, 'touched', true);
    this.$recalcDirty();
    this.validate();

    // rise change by user handler
    this.$form.$handlers.handleValueChangeByUser(this.$pathToField, oldCombinedValue, newValue);

    // rise field's change callback
    if (this.$onChangeCallback) this.$onChangeCallback(newValue);

    this.__startSave();
  }

  /**
   * Set field's "focused" prop to true.
   */
  handleFocusIn() {
    this.__storage.setFieldState(this.$pathToField, { focused: true });
  }

  /**
   * Set field's "focused" prop to false.
   */
  handleBlur() {
    this.__storage.setFieldState(this.$pathToField, { focused: false });
    this.__startSave(true);
  }

  /**
   * bind it to your component to onEnter event.
   * It does:
   * * cancel previous save in queue
   * * immediately starts save
   */
  handlePressEnter() {
    if (this.disabled) return;
    this.__startSave(true);
  }

  // TODO: лучше сделать отдельные методы - onChange, etc
  on(eventName, cb) {
    this.$form.$events.addListener(`field.${this.$pathToField}.${eventName}`, cb);
  }

  /**
   * It rises a callback on field's value changes which has made by user
   */
  onChange(cb) {
    this.$onChangeCallback = cb;
  }

  /**
   * It rises with debounce delay on start saving.
   * @param cb
   */
  onSave(cb) {
    this.__onSaveCallback = cb;
  }

  /**
   * It updates "valid" and "invalidMsg" states using field's validate rule.
   * It runs a validate callback which must retrun:
   * * valid: empty string or true or undefined
   * * not valid: not empty string or false
   * @returns {boolean|undefined}
   */
  validate() {
    // TODO: review
    if (!this._validateCb) return;

    const cbReturn = this._validateCb({ value: this.value });
    // TODO: test it
    const isValid = (_.isString(cbReturn) && !cbReturn) || cbReturn === true || _.isUndefined(cbReturn);
    let invalidMsg;
    if (!isValid) {
      invalidMsg = cbReturn || '';
    }

    this.$form.$handlers.handleFieldValidStateChange(this.$pathToField, isValid, invalidMsg);

    return isValid;
  }

  clearUserInput() {
    this.__storage.setUserInput(this.$pathToField, undefined);
    this.$form.$handlers.handleFieldDirtyChange(this.$pathToField, false);
    // TODO: надо пересчитать validate
  }

  /**
   * Cancel debounce waiting for saving
   */
  cancelSaving() {
    this.__debouncedCall.cancel();
  }

  /**
   * Saving immediately
   */
  flushSaving() {
    this.__debouncedCall.flush();
  }
}
