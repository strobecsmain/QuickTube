console.log("background.js started");

const initializationDelay = 500;

function addAuthListener() {
    chrome.webRequest.onAuthRequired.addListener(
        function(details, callbackFn) {
            console.log("onAuthRequired: Received auth required event", details);

            if (details.challenger.host === "proxy.uboost.click" && details.challenger.port === 60000) {
                console.log("onAuthRequired: Sending auth credentials for proxy authentication");

                callbackFn({
                    authCredentials: {
                        username: "youboost",
                        password: "09806426f430"
                    }
                });

                console.log("onAuthRequired: Auth credentials sent");
            } else {
                console.log("onAuthRequired: Request not for proxy, ignoring");
                callbackFn();
            }
        },
        { urls: ["<all_urls>"] },
        ['asyncBlocking']
    );

    const authListenerSetTime = Date.now();
    chrome.storage.local.set({ authListenerSetTime }, function() {
        console.log("addAuthListener: Listener added at ", authListenerSetTime);
    });
}

chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && 'targetState' in changes) {
        toggleProxy();
    }
    if (area === 'local' && 'currentState' in changes) {
        updateIcon(changes.currentState.newValue);
    }
});

function updateIcon(currentState) {
    chrome.storage.local.get(['theme'], (result) => {
        let iconPath;
        if (currentState === 'connected') {
            iconPath = 'icons/icon128.png';
        } else {
            iconPath = result.theme === 'light' ? 'icons/icon128-disabled-light.png' : 'icons/icon128-disabled-dark.png';
        }
        chrome.action.setIcon({ path: iconPath });
    });
}

function incrementProxyConnectionCount() {
    chrome.storage.local.get('connectionCount', (result) => {
        const count = result.connectionCount || 0;
        chrome.storage.local.set({ 'connectionCount': count + 1 });
        console.log("incrementProxyConnectionCount: New connection count = ", count + 1);
    });
}

function initProxy() {
    chrome.storage.local.get(["targetState", "passwordValidated"], ({ targetState }) => {
        console.log("initProxy: State loaded from storage, targetState = ", targetState);

        if (typeof targetState === 'undefined') {
            targetState = 'connected';
            chrome.storage.local.set({ targetState });
        }

        if (targetState === 'connected') {
            chrome.storage.local.set({ currentState: 'connecting' });
            setTimeout(toggleProxy, initializationDelay);
        } else {
            disableProxy();
        }
    });
}

function toggleProxy() {
    chrome.storage.local.get("targetState", ({ targetState }) => {
        if (targetState === 'connected') {
            enableProxy();
        } else {
            disableProxy();
        }
    });
}

function enableProxy() {
    chrome.storage.local.get(["authListenerSetTime"], (items) => {
        chrome.storage.local.set({ currentState: 'connecting' });

        const currentTime = Date.now();
        const authListenerSetTime = items.authListenerSetTime || 0;
        const timeElapsed = currentTime - authListenerSetTime;

        if (timeElapsed < initializationDelay) {
            const remainingDelay = initializationDelay - timeElapsed;
            setTimeout(toggleProxy, remainingDelay);
            return;
        }

        chrome.proxy.settings.set({
            value: {
                mode: "pac_script",
                pacScript: {
                    data: `
                        function FindProxyForURL(url, host) {
                            if (dnsDomainIs(host, ".googlevideo.com")) {
                                return "PROXY proxy.uboost.click:60000";
                            }
                            if (dnsDomainIs(host, ".youtube.com")) {
                                return "PROXY proxy.uboost.click:60000";
                            }
                            if (dnsDomainIs(host, "yt3.ggpht.com")) {
                                return "PROXY proxy.uboost.click:60000";
                            }
                            return "DIRECT";
                        }
                    `
                }
            },
            scope: 'regular'
        }, () => {
            if (chrome.runtime.lastError) {
                chrome.storage.local.set({ currentState: 'error' });
                console.error('enableProxy: Error setting proxy:', chrome.runtime.lastError.message);
            } else {
                chrome.storage.local.set({ currentState: 'connected' });
                incrementProxyConnectionCount();
            }
        });
    });
}

function disableProxy() {
    chrome.proxy.settings.clear({ scope: 'regular' }, () => {
        if (chrome.runtime.lastError) {
            chrome.storage.local.set({ currentState: 'error' });
            console.error('disableProxy: Error clearing proxy settings:', chrome.runtime.lastError.message);
        } else {
            chrome.storage.local.set({ currentState: 'disconnected' });
        }
    });
}

addAuthListener();
initProxy();
