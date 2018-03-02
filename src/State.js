/**
 * It sets field and form states and rise an event if need
 * @class
 */
module.exports = class State {
  constructor(form, storage) {
    this._form = form;
    this._storage = storage;
  }

  setFormSavingState(value) {
    this._storage.setFormState('saving', value);
  }

  setFieldSavingState(pathToField, value) {
    this._storage.setFieldState(pathToField, { saving: value });
  }

  setFieldAndFormTouched(pathToField) {
    this._storage.setFieldState(pathToField, { touched: true });
    this._storage.setFormState('touched', true);
  }

  setFieldAndFormDirty(pathToField, newDirtyValue) {
    // set to field
    this._storage.setFieldState(pathToField, { dirty: newDirtyValue });

    // set to form
    if (newDirtyValue) {
      // if field is dirty it means the form is dirty too
      this._storage.setFormState('dirty', true);
    }
    else {
      // if field not dirty - calculate form's dirty state
      // search for other dirty values in other fields
      const hasAnyDirty = this._storage.findFieldStateRecursively('fieldsState', (field) => {
        if (field.dirty) return true;
      });

      this._storage.setFormState('dirty', !!hasAnyDirty);
    }
  }

};
