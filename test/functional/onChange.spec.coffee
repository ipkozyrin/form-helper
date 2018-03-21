formHelper = require('../../src/index')


describe.only 'Functional. onChange and handleChange.', ->
  beforeEach () ->
    @form = formHelper.newForm()
    @form.init(['name'])
    @field = @form.fields.name

    @fieldOnChangeHandler = sinon.spy();
    @formOnChangeHandler = sinon.spy();
    @fieldOnSaveHandler = sinon.spy();
    @formOnSaveHandler = sinon.spy();

    @field.onChange(@fieldOnChangeHandler);
    @form.onChange(@formOnChangeHandler);
    @field.onSave(@fieldOnSaveHandler);
    @form.on('saveEnd', @formOnSaveHandler);

  it "call after setValue", ->
    @field.handleChange('userValue')
    @field.flushSaving();

    sinon.assert.calledOnce(@fieldOnChangeHandler)
    sinon.assert.calledWith(@fieldOnChangeHandler, {
      event: 'change'
      fieldName: "name"
      oldValue: undefined
      value: "userValue"
    })

    sinon.assert.calledOnce(@formOnChangeHandler)
    sinon.assert.calledWith(@formOnChangeHandler, {name: 'userValue'})

  it "don't call after machine update", ->
    @field.setValue('machineValue')

    sinon.assert.notCalled(@fieldOnChangeHandler)
    sinon.assert.notCalled(@formOnChangeHandler)

  it "it doesn't rise events on set initial values", ->
    @field.setValue('initialValue')

    sinon.assert.notCalled(@fieldOnChangeHandler)
    sinon.assert.notCalled(@formOnChangeHandler)

  it "call after uncahnged value if @form.config.allowSaveUnmodifiedField = true", ->
    @form.config.allowSaveUnmodifiedField = true;
    @field.handleChange('userValue')
    @field.handleChange('userValue')

    @field.flushSaving();

    sinon.assert.calledTwice(@fieldOnChangeHandler)
    sinon.assert.calledTwice(@formOnChangeHandler)
    sinon.assert.calledOnce(@fieldOnSaveHandler)
    sinon.assert.calledOnce(@formOnSaveHandler)

  it "dont call after uncahnged value if @form.config.allowSaveUnmodifiedField = false", ->
    @form.config.allowSaveUnmodifiedField = false;
    @field.handleChange('userValue')
    @field.handleChange('userValue')

    @field.flushSaving();

    sinon.assert.calledOnce(@fieldOnChangeHandler)
    sinon.assert.calledWith(@fieldOnChangeHandler, {
      event: 'change'
      fieldName: "name"
      oldValue: undefined
      value: "userValue"
    })

    sinon.assert.calledOnce(@formOnChangeHandler)
    sinon.assert.calledWith(@formOnChangeHandler, {name: 'userValue'})

    sinon.assert.calledOnce(@fieldOnSaveHandler)
    sinon.assert.calledOnce(@formOnSaveHandler)

  it "don't do anything if disabled", ->
    @field.handleChange('oldValue')
    @field.setDisabled(true)
    @field.handleChange('newValue')
    @field.flushSaving();

    assert.equal(@field.value, 'oldValue')
