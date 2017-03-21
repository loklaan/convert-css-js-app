import React, { Component, PropTypes } from 'react';
import styled, { injectGlobal } from 'styled-components';
import postcss from 'postcss';
import cssjs from 'postcss-js';
import Ace from 'react-ace';
import 'brace/mode/javascript';
import 'brace/mode/scss';
import 'brace/theme/tomorrow_night_blue';

function debounce (func, timeout) {
  let timerId = null;
  return (...args) => {
    clearTimeout(timerId);
    timerId = setTimeout(() => {
      func(...args);
    }, timeout);
  }
}

const theme = {
  PRIMARY: '#c7446f',
  SECONDARY: '#002451',
  TERTIARY: '#a4234c'
}

const INITIAL_CSS_CODE = `
background: royalblue;
text-align: salmon;
border: solid 2px green;
font-family: 'Slabo', serif;
-webkit-user-select: none;
&:hover {
  color: #C0FFEE
}
`.trim();

injectGlobal`
  * {
    box-sizing: border-box;
  }
`;

// language=SCSS prefix="*{" suffix="}"
const Shell = styled.div`
  background: ${theme.PRIMARY};
  border: solid 3px ${theme.TERTIARY};
  border-radius: 5px;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100vw;
  height: 100vh;
  &:before {
    content: '';
    background: ${theme.TERTIARY};
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: -1;
  }
`;

// language=SCSS prefix="*{" suffix="}"
const Pane = styled.div`
  position: relative;
  box-shadow: 6px 7px 0 ${theme.TERTIARY};
  border: solid 5px #002047;
  border-radius: 10px;
  height: 78vh;
  width: 41vw;
  padding: 20px 10px;
  background: ${theme.SECONDARY};
  &:first-child {
    margin-right: 3vw;
  }
  &:last-child {
    margin-left: 3vw;
  }
  & .ace_gutter {
    background: ${theme.SECONDARY} !important;
  }
`;

// language=SCSS prefix="*{" suffix="}"
const DOODAD_TEXT_STYLES = `
  color: ${theme.TERTIARY};
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
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
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

class EditCode extends Component {
  constructor (props, ...args) {
    super(props, ...args);

    this.state = { code: props.value || '' };

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

function toJS (css) {
  try {
    const code = cssjs.objectify(postcss.parse(css));
    return JSON.stringify(code, null, 2).replace(/'/g, `\\'`).replace(/"/g, `'`).replace(/'(?=.*:)/g, '').split('\n').map(line => {
      if (!line) debugger;
      if (line.match(/[\-@:&\.#](?=.*:)/g)) {
        return line.replace(/(\S.*)(?=:)/, `'$1'`)
      } else {
        return line;
      }
    }).join('\n')
  } catch (err) {}
}

function toCSS (js, cb) {
  try {
    let val = null;
    eval(`val = ${js}`);
    postcss().process(val, { parser: cssjs })
      .then(code => cb(code.css));
  } catch (err) {}
}

const CODE_FLUSH = 400;
class Root extends Component {
  constructor (...args) {
    super(...args);

    this.state = { cssCode: INITIAL_CSS_CODE, jsCode: toJS(INITIAL_CSS_CODE) };
    
    this.onEditCssCode = debounce(this.onEditCssCode.bind(this), CODE_FLUSH);
    this.onEditJsCode = debounce(this.onEditJsCode.bind(this), CODE_FLUSH);
  }

  onEditCssCode (value) {
    if (value.length < 4) return;
    else {
      this.setState(() => { jsCode: toJS(value) })
    }
  }

  onEditJsCode (value) {
    if (value.length < 4) return;
    else {
      toCSS(value, (css) => this.setState({ cssCode: css }));
    }
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
