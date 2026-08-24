module.exports = function (api) {
  api.cache(true);

  // DraftBit's JSX-source injector lives in DraftBit's build image, not on npm. Outside
  // that image (fresh clone, CI, local device/simulator builds) it's absent, so include
  // it only when it actually resolves — otherwise the Metro bundle fails to load it. It's
  // an editor dev tool, so omitting it doesn't change app or test behavior.
  const plugins = [];
  for (const candidate of [
    '@draftbit/babel-plugin-inject-jsx-source',
    '/usr/local/node_modules/@draftbit/babel-plugin-inject-jsx-source',
  ]) {
    try {
      plugins.push(require.resolve(candidate));
      break;
    } catch {
      // not present in this environment — try the next candidate
    }
  }

  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind', unstable_transformImportMeta: true }],
      'nativewind/babel',
    ],
    plugins,
  };
};
