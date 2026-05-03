// Metro + Watchman cannot watch iCloud Drive paths ("Mobile Documents/…"):
// macOS returns EPERM. Disable Watchman so Metro uses the Node file crawler.
const { getDefaultConfig } = require('expo/metro-config')

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname)

config.resolver = {
  ...config.resolver,
  useWatchman: false,
}

module.exports = config
