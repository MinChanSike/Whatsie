import remote from 'remote';
import platform from 'platform';
import path from 'path';

const manifest = remote.getGlobal('manifest');
const prefs = remote.require('../browser/utils/prefs').default;
const browserAnalytics = remote.require('../browser/utils/analytics');

const activeTheme = prefs.get('theme');
const activeSpellCheckerLang = prefs.get('theme');
const activeReleaseChannel = prefs.get('theme');
const trackAnalytics = prefs.get('analytics-track');
const userId = browserAnalytics.getUserId();
const siteId = 1;

let piwikTracker = null;

function getOsName() {
  return {
    darwin: 'OS X',
    win32: 'Windows',
    linux: 'Linux'
  }[process.platform];
}

function getOsNameLong() {
  let name = platform.os.family;
  if (platform.os.version) {
    name += ' ' + platform.os.version;
  }
  if (process.platform != 'darwin') {
    name += ' ' + {
      ia32: 'x32',
      x64: 'x64'
    }[process.arch];
  }
  return name;
}

if (trackAnalytics && manifest.piwik) {
  log('enabling piwik analytics');

  // Configure
  window.piwikAsyncInit = function() {
    try {
      piwikTracker = window.Piwik.getTracker();
      piwikTracker.setDocumentTitle(document.title);
      piwikTracker.setTrackerUrl(manifest.piwik.serverUrl + '/piwik.php');
      piwikTracker.setCustomDimension(1, manifest.version); // Version
      piwikTracker.setCustomDimension(2, activeReleaseChannel); // Release Channel
      piwikTracker.setCustomDimension(3, manifest.distrib); // Distrib
      piwikTracker.setCustomDimension(4, activeTheme); // Theme
      piwikTracker.setCustomDimension(5, activeSpellCheckerLang); // Spell Checker Language
      piwikTracker.setCustomDimension(6, getOsName()); // Operating System
      piwikTracker.setCustomDimension(7, getOsNameLong()); // Operating System + Version
      piwikTracker.setCustomUrl(getCustomUrl());
      piwikTracker.setUserId(userId);
      piwikTracker.setSiteId(siteId);
      piwikTracker.trackPageView();
      log('piwik analytics instance created');
    } catch (err) {
      log(err);
    }
  };

  // Load the tracking lib
  const scriptElem = document.createElement('script');
  scriptElem.type = 'text/javascript';
  scriptElem.async = true;
  scriptElem.defer = true;
  scriptElem.src = manifest.piwik.serverUrl + '/piwik.js';
  document.head.appendChild(scriptElem);
} else {
  log('piwik analytics disabled');
}

function getCustomUrl() {
  const pathname = document.location.pathname;
  let appDirPath = remote.app.getAppPath();

  // Fix path separators on win32
  if (process.platform === 'win32') {
    appDirPath = ('\\' + appDirPath).replace(/\\/g, '/');
  }

  const indexOfAppDir = pathname.indexOf(appDirPath);
  let customPath = null;

  if (indexOfAppDir > -1) {
    customPath = pathname.replace(appDirPath, '');
  } else {
    customPath = path.posix.join('/raw', pathname);
  }

  return path.posix.join(manifest.piwik.baseUrl, customPath);
}

export function getTracker() {
  return piwikTracker;
}

export default {
  getTracker
};
