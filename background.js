// Ссылка на файл с прокси на GitHub
const proxyUrl = "https://raw.githubusercontent.com/strobecsmain/testpys/main/pxts";

// Шаг 1: Загрузка списка прокси с GitHub
async function loadProxies() {
    try {
        const response = await fetch(proxyUrl);
        const text = await response.text();
        const proxies = text.split('\n').map(line => line.trim()).filter(line => line);

        // Предпочтение SOCKS5, затем SOCKS4, затем HTTP/HTTPS
        const sortedProxies = proxies.map(proxy => {
            const [type, url] = proxy.includes("://") ? proxy.split("://") : ["http", proxy];
            return { url: `${type}://${url}`, type };
        }).sort((a, b) => {
            const order = { "socks5": 1, "socks4": 2, "http": 3, "https": 3 };
            return order[a.type] - order[b.type];
        });

        return sortedProxies;
    } catch (error) {
        console.error("Ошибка загрузки списка прокси:", error);
        return [];
    }
}

// Шаг 2: Тестирование прокси
function testProxy(proxy) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = `http://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png?proxy=${proxy.url}`;
        img.onload = () => resolve({ proxy, success: true });
        img.onerror = () => resolve({ proxy, success: false });
    });
}

// Шаг 3: Определение лучшего прокси
async function findBestProxy(proxyList) {
    console.log("Starting proxy test...");
    const results = await Promise.all(proxyList.map(testProxy));
    const successfulProxies = results.filter(result => result.success);
    console.log(`Total proxies tested: ${results.length}`);
    console.log(`Working proxies found: ${successfulProxies.length}`);

    if (successfulProxies.length > 0) {
        const bestProxy = successfulProxies[0].proxy;
        console.log(`Best proxy selected: ${bestProxy.url} (${bestProxy.type.toUpperCase()})`);
        return bestProxy;
    } else {
        throw new Error("No working proxies found");
    }
}

// Шаг 4: Подключение к лучшему прокси
async function connectToBestProxy() {
    try {
        const initialIP = await getCurrentIPAddress();
        console.log(`Initial IP address: ${initialIP}`);

        const proxyList = await loadProxies();
        const bestProxy = await findBestProxy(proxyList);

        chrome.proxy.settings.set({
            value: {
                mode: "pac_script",
                pacScript: {
                    data: `
                    function FindProxyForURL(url, host) {
                        if (dnsDomainIs(host, ".googlevideo.com") ||
                            dnsDomainIs(host, ".youtube.com") ||
                            dnsDomainIs(host, ".ytimg.com") ||
                            dnsDomainIs(host, ".ggpht.com")) {
                            return "${bestProxy.type.toUpperCase()} ${bestProxy.url}";
                        }
                        return "DIRECT";
                    }`
                }
            },
            scope: 'regular'
        });

        // Проверка IP после подключения к прокси
        setTimeout(async () => {
            const newIP = await getCurrentIPAddress();
            console.log(`New IP address after connecting to proxy: ${newIP}`);
        }, 5000); // Даем время для применения настроек прокси

    } catch (e) {
        console.error(e);
    }
}

// Функция получения текущего IP-адреса
async function getCurrentIPAddress() {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
}

// Запуск при установке расширения
chrome.runtime.onInstalled.addListener(connectToBestProxy);
