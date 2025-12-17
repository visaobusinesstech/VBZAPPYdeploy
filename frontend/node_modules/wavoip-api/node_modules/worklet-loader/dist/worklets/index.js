"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _path = _interopRequireDefault(require("path"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable multiline-ternary */
const getWorklet = (file, content, options) => {
  const publicPath = options.publicPath ? JSON.stringify(options.publicPath) : '__webpack_public_path__';
  const publicWorkletPath = `${publicPath} + ${JSON.stringify(file)}`;

  if (options.inline) {
    const InlineWorkletPath = JSON.stringify(`!!${_path.default.join(__dirname, 'InlineWorklet.js')}`);
    return `require(${InlineWorkletPath})(${JSON.stringify(content)})`;
  }

  return publicWorkletPath;
};

var _default = getWorklet;
exports.default = _default;