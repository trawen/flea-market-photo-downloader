import PlatformFactory from './PlatformFactory.js'

const Platform = PlatformFactory.create(window.location.href)
if (Platform) {
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'collectImages') {
      Platform.collectData().then((result) => {
        sendResponse(result)
      })
      return true // async response
    }
  })
} else {
  throw new Error('Platform not found!')
}
