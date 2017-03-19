import React, { Component, PropTypes } from 'react';
import styled, { injectGlobal } from 'styled-components';
import debounce from 'lodash.debounce';
import postcss from 'postcss';
import cssjs from 'postcss-js';

injectGlobal`
  * {
    box-sizing: border-box;
  }
`;

// language=CSS prefix="._{" suffix="}"
const Shell = styled.div`
  display: flex;
  justify-content: center;
  align-items: stretch;
  width: 100vw;
  height: 100vh;
`;

// language=CSS prefix="._{" suffix="}"
const EditBox = styled.textarea`
  flex: 1;
  /*margin: 1rem;*/
  border: solid 1px black;
`;

class EditCode extends Component {
  constructor (...args) {
    super(...args);

    this.state = { code: '' };

    this.onEdit = this.onEdit.bind(this);
  }

  onEdit (event) {
    const value = event.target.value;
    this.setState(() => ({ code: value }));
    this.props.onChange(value);
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.value !== this.props.value) {
      this.setState(() => ({ code: nextProps.value }));
    }
  }

  render () {
    return (
      <EditBox value={this.state.code} onChange={this.onEdit} />
    );
  }
}
EditCode.propTypes = {
  mode: PropTypes.string
};

class Root extends Component {
  constructor (...args) {
    super(...args);

    this.state = { code: '' };

    this.onEditCssCode = debounce(this.onEditCssCode.bind(this), 600);
    this.onEditJsCode = debounce(this.onEditJsCode.bind(this), 600);
  }

  onEditCssCode (value) {
    try {
      const code = cssjs.objectify(postcss.parse(value));
      let _code = JSON.stringify(code, null, 2);
      _code = _code.replace(/"/g, `'`).replace(/'(?=.*:)/g, '').split('\n').map(line => {
        if (line.match(/[\-@:&](?=.*:)/g)) {
          return line.replace(/(\S.*)(?=:)/, `'$1'`)
        } else {
          return line;
        }
      }).join('\n')
      this.setState(() => ({ jsCode: _code }));
    } catch (err) {}
  }

  onEditJsCode (value) {
    try {
      let val;
      eval(`val = ${value}`);
      postcss().process(val, { parser: cssjs }).then(code => {
        this.setState(() => ({ cssCode: code }));
      });
    } catch (err) {}
  }

  render () {
    return (
      <Shell>
        <EditCode onChange={this.onEditCssCode} value={this.state.cssCode} />
        <EditCode onChange={this.onEditJsCode} value={this.state.jsCode} />
      </Shell>
    );
  }
}

export default Root;
