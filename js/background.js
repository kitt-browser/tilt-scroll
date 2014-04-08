// Has the user clicked on lock button?
var lock = false;

chrome.browserAction.onClicked.addListener(function() {
    lock = !lock;
    chrome.browserAction.setIcon({path:'images/'+(lock?'icon_locked':'icon')+'.png'});
    chrome.tabs.query({active:true}, function(tabs) {
        if (tabs.length === 1) {
            // Notify active page about onClick event
            chrome.tabs.sendMessage(tabs[0].id, {cmd :'content.onClick', lock:lock}, function (response) {
            });
        }
    });
});