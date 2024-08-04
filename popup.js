document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.local.get(['currentState'], function(result) {
        const statusElement = document.getElementById('status');
        const currentState = result.currentState || 'unknown';

        switch (currentState) {
            case 'connected':
                statusElement.textContent = 'Connected';
                statusElement.style.color = 'green';
                break;
            case 'connecting':
                statusElement.textContent = 'Connecting...';
                statusElement.style.color = 'orange';
                break;
            case 'disconnected':
                statusElement.textContent = 'Disconnected';
                statusElement.style.color = 'red';
                break;
            case 'error':
                statusElement.textContent = 'Error';
                statusElement.style.color = 'red';
                break;
            default:
                statusElement.textContent = 'Unknown status';
                statusElement.style.color = 'gray';
                break;
        }

        // Добавление анимейшина
        statusElement.style.transition = 'color 0.5s ease';
    });


    document.querySelector('.button').addEventListener('click', function() {
        alert('Скрипт обновлён!');
        // Сюда функционал прикрутить надо
    });

    // Редир
    document.getElementById('projects-button').addEventListener('click', function() {
        window.open('https://github.com/strobecsmain', '_blank');
    });

    // Редир
    document.getElementById('problem-button').addEventListener('click', function() {
        window.open('https://t.me/SiresMacro', '_blank');
    });
});
