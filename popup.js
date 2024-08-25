document.addEventListener("DOMContentLoaded", function () {
    const statusElement = document.getElementById("status");

    // Запрос статуса подключения к прокси
    chrome.runtime.sendMessage({ action: "getStatus" }, function (response) {
        statusElement.textContent = response.status || "Неизвестный статус";
    });

    // Обработчик кнопки "Другие проекты"
    document.getElementById("projects-button").addEventListener("click", function() {
        chrome.tabs.create({ url: "https://github.com/strobecsmain" });
    });

    // Обработчик кнопки "Сообщить о проблеме"
    document.getElementById("problem-button").addEventListener("click", function() {
        chrome.tabs.create({ url: "https://t.me/SiresMacro" });
    });
});
