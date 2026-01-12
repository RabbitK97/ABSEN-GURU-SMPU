// ======================================
// notification.js
// Global Notification Popup
// ======================================

document.addEventListener('DOMContentLoaded', () => {

    const notification = document.getElementById('notification');

    if (!notification) {
        console.warn('Elemen #notification tidak ditemukan di HTML');
        return;
    }

    // Inject style jika belum ada
    injectNotificationStyle();

    window.showNotification = function (message, type = 'success', duration = 2500) {
        notification.textContent = message;
        notification.className = 'notification show';

        if (type === 'success') {
            notification.classList.add('success');
        } else if (type === 'error') {
            notification.classList.add('error');
        } else if (type === 'warning') {
            notification.classList.add('warning');
        }

        clearTimeout(notification._timeout);
        notification._timeout = setTimeout(() => {
            notification.classList.remove('show');
        }, duration);
    };

    function injectNotificationStyle() {
        if (document.getElementById('notification-style')) return;

        const style = document.createElement('style');
        style.id = 'notification-style';
        style.innerHTML = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 18px;
                border-radius: 6px;
                color: #fff;
                font-size: 14px;
                opacity: 0;
                transform: translateY(-10px);
                transition: all 0.3s ease;
                z-index: 9999;
                pointer-events: none;
                max-width: 300px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }

            .notification.show {
                opacity: 1;
                transform: translateY(0);
            }

            .notification.success {
                background-color: rgba(40, 167, 69, 0.95);
            }

            .notification.error {
                background-color: rgba(200, 30, 30, 0.95);
            }

            .notification.warning {
                background-color: rgba(255, 193, 7, 0.95);
                color: #000;
            }

            @media (max-width: 480px) {
                .notification {
                    right: 10px;
                    left: 10px;
                    top: 10px;
                    max-width: unset;
                }
            }
        `;
        document.head.appendChild(style);
    }

});
