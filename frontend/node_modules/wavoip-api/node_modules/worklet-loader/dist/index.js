"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = loader;
exports.pitch = pitch;

var _options = _interopRequireDefault(require("./options.json"));

var _loaderUtils = _interopRequireDefault(require("loader-utils"));

var _schemaUtils = _interopRequireDefault(require("schema-utils"));

var _NodeTargetPlugin = _interopRequireDefault(require("webpack/lib/node/NodeTargetPlugin"));

var _SingleEntryPlugin = _interopRequireDefault(require("webpack/lib/SingleEntryPlugin"));

var _worklets = _interopRequireDefault(require("./worklets/"));

var _Error = _interopRequireDefault(require("./Error"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable
  import/first,
  import/order,
  comma-dangle,
  linebreak-style,
  no-param-reassign,
  no-underscore-dangle,
  prefer-destructuring
*/
function loader() {}

function pitch(request) {
  const options = _loaderUtils.default.getOptions(this) || {};
  (0, _schemaUtils.default)(_options.default, options, 'Worklet Loader');

  if (!this.webpack) {
    throw new _Error.default({
      name: 'Worklet Loader',
      message: 'This loader is only usable with webpack'
    });
  }

  this.cacheable(false);
  const cb = this.async();

  const filename = _loaderUtils.default.interpolateName(this, options.name || '[hash].worklet.js', {
    context: options.context || this.rootContext || this.options.context,
    regExp: options.regExp
  });

  const worker = {};
  worker.options = {
    filename,
    chunkFilename: `[id].${filename}`,
    namedChunkFilename: null
  };
  worker.compiler = this._compilation.createChildCompiler('worker', worker.options); // Tapable.apply is deprecated in tapable@1.0.0-x.
  // The plugins should now call apply themselves.
  // new WebWorkerTemplatePlugin(worker.options).apply(worker.compiler);

  if (this.target !== 'webworker' && this.target !== 'web') {
    new _NodeTargetPlugin.default().apply(worker.compiler);
  }

  new _SingleEntryPlugin.default(this.context, `!!${request}`, 'main').apply(worker.compiler);
  const subCache = `subcache ${__dirname} ${request}`;

  worker.compilation = compilation => {
    if (compilation.cache) {
      if (!compilation.cache[subCache]) {
        compilation.cache[subCache] = {};
      }

      compilation.cache = compilation.cache[subCache];
    }
  };

  if (worker.compiler.hooks) {
    const plugin = {
      name: 'WorkletLoader'
    };
    worker.compiler.hooks.compilation.tap(plugin, worker.compilation);
  } else {
    worker.compiler.plugin('compilation', worker.compilation);
  }

  worker.compiler.runAsChild((err, entries, compilation) => {
    if (err) return cb(err);

    if (entries[0]) {
      worker.file = entries[0].files[0];
      worker.factory = (0, _worklets.default)(worker.file, compilation.assets[worker.file].source(), options);

      if (options.inline) {
        delete this._compilation.assets[worker.file];
      }

      return cb(null, `module.exports = ${worker.factory};`);
    }

    return cb(null, null);
  });
}