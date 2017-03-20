import React, { Component, PropTypes } from 'react';
import styled, { injectGlobal } from 'styled-components';
import debounce from 'lodash.debounce';
import postcss from 'postcss';
import cssjs from 'postcss-js';
import Ace from 'react-ace';

const R = '#c7446f';
const P = '#f19df1';
const B = '#5596e6';
const DB = '#002451';
const theme = {
  PRIMARY: R,
  SECONDARY: P,
  TERTIARY: B
}

injectGlobal`
  * {
    box-sizing: border-box;
  }
`;

// language=SCSS prefix="*{" suffix="}"
const Shell = styled.div`
  background: ${theme.PRIMARY};
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100vw;
  height: 100vh;
`;

// language=SCSS prefix="*{" suffix="}"
const Pane = styled.div`
  position: relative;
  box-shadow: 7px 9px 0 ${theme.TERTIARY};
  border: solid 6px ${theme.SECONDARY};
  border-radius: 15px;
  height: 78vh;
  width: 41vw;
  padding: 10px;
  background: ${DB};
  &:first-child {
    margin-right: 3vw;
  }
  &:last-child {
    margin-left: 3vw;
  }
  & .ace_gutter {
    background: ${DB} !important;
  }
`;

// language=SCSS prefix="*{" suffix="}"
const DOODAD_TEXT_STYLES = `
  color: #501b2c;
  font-size: 26px;
  font-weight: 700;
  user-select: none;
  cursor: default;
`;

// language=SCSS prefix="*{" suffix="}"
const PaneLabel = styled.h2`
  position: absolute;
  top: -40px;
  right: 0;
  left: 0;
  font-family: monospace;
  text-align: center;
  margin: 0;
  padding: 0;
  ${DOODAD_TEXT_STYLES}
`;

// language=SCSS prefix="*{" suffix="}"
const Arrows = styled.span`
  position: absolute;
  top: 8vh;
  text-align: center;
  ${DOODAD_TEXT_STYLES}
`;

import 'brace/mode/javascript';
import 'brace/mode/scss';
import 'brace/theme/tomorrow_night_blue';
class EditCode extends Component {
  constructor (...args) {
    super(...args);

    this.state = { code: '' };

    this.onEdit = this.onEdit.bind(this);
  }

  onEdit (value) {
    this.setState(() => ({ code: value }));
    this.props.onChange(value);
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.value !== this.props.value) {
      this.setState(() => ({ code: nextProps.value }));
    }
  }

  render () {
    const {
      mode,
      label
    } = this.props;
    return (
    <Pane>
      <Ace
        mode={mode}
        theme='tomorrow_night_blue'
        height='100%'
        width='100%'
        value={this.state.code}
        onChange={this.onEdit}
        tabSize={2}
        fontSize={20}
        showPrintMargin={false}
        wrapEnabled={true}
        setOptions={{
          useWorker: false,
          behavioursEnabled: false,
          displayIndentGuides: false
        }}
      />
      <PaneLabel>{label}</PaneLabel>
    </Pane>
  );
  }
}
EditCode.propTypes = {
  mode: PropTypes.string
};

const CODE_FLUSH = 400;
class Root extends Component {
  constructor (...args) {
    super(...args);

    this.state = { code: '' };

    this.onEditCssCode = debounce(this.onEditCssCode.bind(this), CODE_FLUSH);
    this.onEditJsCode = debounce(this.onEditJsCode.bind(this), CODE_FLUSH);
  }

  onEditCssCode (value) {
    if (value.length < 4) return;
    try {
      const code = cssjs.objectify(postcss.parse(value));
      let _code = JSON.stringify(code, null, 2);
      _code = _code.replace(/"/g, `'`).replace(/'(?=.*:)/g, '').split('\n').map(line => {
        if (!line) debugger;
        if (line.match(/[\-@:&\.#](?=.*:)/g)) {
          return line.replace(/(\S.*)(?=:)/, `'$1'`)
        } else {
          return line;
        }
      }).join('\n')
      this.setState(() => ({ jsCode: _code }));
    } catch (err) {}
  }

  onEditJsCode (value) {
    if (value.length < 4) return;
    try {
      let val = null;
      eval(`val = ${value}`);
      postcss().process(val, { parser: cssjs }).then(code => {
        this.setState(() => ({ cssCode: code.css }));
      });
    } catch (err) {}
  }

  render () {
    return (
      <Shell>
        <EditCode
          mode='scss'
          label='CSS'
          onChange={this.onEditCssCode}
          value={this.state.cssCode}
        />
        <Arrows>{'⟷'}</Arrows>
        <EditCode
          mode='javascript'
          label='JS'
          onChange={this.onEditJsCode}
          value={this.state.jsCode}
        />
      </Shell>
    );
  }
}

export default Root;
