import _ from 'lodash';

//import events from './events';
import FieldState from './FieldState';

export default class Field {
  constructor(form, fieldName) {
    this._form = form;

    this._fieldState = new FieldState(this, fieldName);
  }

  setValue(newValue) {
    this.setValueSilently(newValue);
    this._form.$valueChanged(this.name, this.value);
    this._fieldState.setStateValue('touched', true);
    this._fieldState.setStateValue('dirty', this.value !== this.initialValue);
  }

  setInitialValue(newValue) {
    this._fieldState.setInitialValue(newValue);

    // TODO: может ли пользователь установить null?
    if (_.isNull(this.value)) {
      this._fieldState.setValue(newValue);
    }

    //this._updateState();

    // TODO: наверное если не в первый раз, то можно поднимать событие
    // TODO: наверное надо обнулить touched и сбросить dirty
  }

  setValueSilently(newValue) {
    this._fieldState.setValue(newValue);
    //this._updateState();
  }

  /**
   * onChange handler - it must be placed to input onChange attribute
   */
  handleChange(event) {
    var value = event.target.value;
    //this._fieldState.setState({value});
    //this._updateState();
  }

  validate() {
    // TODO: !!!
  }

  /**
   * It rises on each field's value change
   */
  onChange(cb) {
    // TODO: !!!
  }

  // _updateState() {
  //   // TODO: для value и initialValue использовать cloneDeep
  //   _.each(this._fieldState.state, (value, index) => {
  //     this[index] = value;
  //   });
  // }

  // _riseUpdateEvent() {
  //   events.emit('field.value__update', {
  //     name: this.name,
  //     newValue: this.value,
  //     field: this,
  //   });
  // }
}
