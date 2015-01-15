/// <reference path='../typings/chrome/chrome.d.ts'/>

var lockedTabCache: {[id: number]: boolean} = {}

function setLockIcon(yesNo) {
  chrome.browserAction.setIcon({path:'images/'+(yesNo? 'icon_locked': 'icon')+'.png'})
}

chrome.browserAction.onClicked.addListener(() => {
  chrome.tabs.query({active: true}, function(tabs) {
    if (tabs.length > 0) {
      chrome.tabs.sendMessage(tabs[0].id, {cmd: 'content.onClick'}, function (response) {
        lockedTabCache[tabs[0].id] = response.isLocked
        setLockIcon(response.isLocked)
      })
    }
  })
})

chrome.tabs.onActivated.addListener((info) => {
  if (info) {
    setLockIcon(lockedTabCache[info.tabId])
    chrome.tabs.sendMessage(info.tabId, {cmd: 'content.getLockStatus'}, function (response) {
      lockedTabCache[info.tabId] = response.isLocked
      setLockIcon(response.isLocked)
    })
  }
})

chrome.tabs.onRemoved.addListener((id) => {
  delete lockedTabCache[id]
})
