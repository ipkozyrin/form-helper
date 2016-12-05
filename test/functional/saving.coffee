formHelper = require('../../src/index').default

describe 'Functional. saving.', ->
  beforeEach () ->
    this.form = formHelper.newForm()
    this.form.init({ name: null })
    this.saveHandler = sinon.spy();
    this.formSaveHandler = sinon.spy();

  it 'after change value must save debounced', ->
    this.form.onSave(this.formSaveHandler)
    this.form.fields.name.onSave(this.saveHandler)
    this.form.fields.name.handleChange('newValue')
    this.form.fields.name._debouncedCb.flush()

    expect(this.formSaveHandler).to.have.been.calledOnce
    expect(this.formSaveHandler).to.have.been.calledWith({name: 'newValue'})
    expect(this.saveHandler).to.have.been.calledOnce
    expect(this.saveHandler).to.have.been.calledWith('newValue')

  it 'after change and pressing enter, value must save immediately and queue must be cancelled', ->
    this.form.fields.name.onSave(this.saveHandler)
    this.form.fields.name.handleChange('newValue')
    this.form.fields.name.handlePressEnter()

    expect(this.saveHandler).to.have.been.calledOnce
    expect(this.saveHandler).to.have.been.calledWith('newValue')

    this.form.fields.name._debouncedCb.flush()

    expect(this.saveHandler).to.have.been.calledOnce
    expect(this.saveHandler).to.have.been.calledWith('newValue')

  it 'dont\'t save invalid value', ->
    this.form.fields.name.validateRule = () -> false
    this.form.fields.name.onSave(this.saveHandler)
    this.form.fields.name.handleChange('newValue')
    this.form.fields.name._debouncedCb.flush()

    expect(this.saveHandler).to.not.have.been.called

  it 'after change value must save debounced', ->
    this.form.onSave(this.formSaveHandler)
    this.form.fields.name.onSave(this.saveHandler)
    this.form.fields.name.handleChange('newValue')
    this.form.fields.name._debouncedCb.flush()