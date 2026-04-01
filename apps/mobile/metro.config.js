const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const sharedRoot = path.resolve(projectRoot, '..', '..', 'shared');

const config = getDefaultConfig(projectRoot);

// Shared content klasorunu da izle, ama paket cozumu local node_modules ile kalsin.
config.watchFolders = [projectRoot, sharedRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
];

module.exports = config;
