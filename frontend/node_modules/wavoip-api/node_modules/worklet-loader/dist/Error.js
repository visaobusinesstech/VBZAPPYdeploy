"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

class LoaderError extends Error {
  constructor(err) {
    super(err);
    this.name = err.name || 'Loader Error';
    this.message = `${err.name}\n\n${err.message}\n`;
    this.stack = false;
  }

}

var _default = LoaderError;
exports.default = _default;