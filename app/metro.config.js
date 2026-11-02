// Learn more: https://docs.expo.dev/guides/customizing-metro
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const serverSrc = path.resolve(__dirname, '../server/src');

// Demo mode bundles the server's simulator. Its Node-style ESM imports say "./fees.js" for "./fees.ts",
// so drop the ".js" for relative imports made from server/src.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (context.originModulePath.startsWith(serverSrc) && /^\.{1,2}\/.*\.js$/.test(moduleName)) {
    return context.resolveRequest(context, moduleName.slice(0, -3), platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
