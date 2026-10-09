# MAX Chat

Веб-чат для отправки и получения текстовых сообщений в мессенджере MAX через [GREEN-API](https://green-api.com/max).

## Локальный запуск

Нужен Node.js 20 или новее.

```bash
npm install
npm run dev
```

Откройте [http://localhost:5173](http://localhost:5173).

Демо без аккаунта MAX:

```bash
npm run dev:mock
```

Откройте [http://localhost:5174](http://localhost:5174). Подойдут любые `idInstance` из цифр и любой токен. После отправки текста ответ появится в том же чате через пару секунд. Запросы в GREEN-API не уходят.

## Настройка инстанса

1. В [консоли GREEN-API](https://console.green-api.com/) создайте инстанс MAX и авторизуйте его.
2. В настройках уведомлений:
   - оставьте `webhookUrl` пустым, иначе очередь HTTP API не отдаёт сообщения;
   - включите входящие уведомления о сообщениях.
3. Скопируйте `idInstance` и `apiTokenInstance` и введите их на экране входа.

Токен хранится только в `sessionStorage` текущей вкладки и отправляется лишь на `api.green-api.com`.

## Как проверить

1. Войдите с данными инстанса. Вход открывается только если инстанс в состоянии `authorized`.
2. Нажмите «Новый чат» и введите номер получателя.
3. Отправьте текстовое сообщение. Enter отправляет, Shift+Enter переносит строку.
4. Ответьте на него из приложения MAX. Ответ появится в том же чате.

История чатов сохраняется в браузере и не пропадает после обновления страницы.

## Формат номера

Допустимы только номера России и Беларуси:

- Россия: `79991234567` (11 цифр, код `7`). Номер из 10 цифр дополняется кодом `7`, номер с `8` заменяется на `7`.
- Беларусь: `375291234567` (12 цифр, код `375`).

Перед отправкой приложение получает `chatId` методом `checkAccount` и дальше пишет уже по нему. Так ответ из MAX попадает в тот же чат.

## Запросы к API

- `getStateInstance` — проверка, что инстанс авторизован
- `checkAccount` — идентификатор чата по номеру телефона
- `sendMessage` — отправка текста
- `receiveNotification` и `deleteNotification` — получение ответа из очереди HTTP API

В чат попадают только текстовые входящие сообщения. Остальные уведомления снимаются с очереди, чтобы она не останавливалась.

## Сборка

```bash
npm run build
npm run preview
```

# MAX Chat

A web chat for sending and receiving text messages in the MAX messenger through [GREEN-API](https://green-api.com/max).

## Run locally

Node.js 20 or newer is required.

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

Demo without a MAX account:

```bash
npm run dev:mock
```

Open [http://localhost:5174](http://localhost:5174). Any numeric `idInstance` and any token are accepted. A few seconds after you send a text, a reply appears in the same chat. No requests are sent to GREEN-API.

## Instance setup

1. In the [GREEN-API console](https://console.green-api.com/), create a MAX instance and authorize it.
2. In the notification settings:
   - leave `webhookUrl` empty, otherwise the HTTP API queue does not return messages;
   - turn on incoming message notifications.
3. Copy `idInstance` and `apiTokenInstance` and enter them on the login screen.

The token stays in the current tab's `sessionStorage` and is sent only to `api.green-api.com`.

## How to check

1. Sign in with the instance credentials. The chat opens only when the instance state is `authorized`.
2. Click "Новый чат" and enter the recipient's phone number.
3. Send a text message. Enter sends, Shift+Enter adds a new line.
4. Reply from the MAX app. The reply shows up in the same chat.

Chat history is stored in the browser and stays after a page refresh.

## Phone format

Only Russian and Belarusian numbers are accepted:

- Russia: `79991234567` (11 digits, code `7`). A 10-digit number gets the `7` prefix, and a leading `8` is replaced with `7`.
- Belarus: `375291234567` (12 digits, code `375`).

Before sending, the app gets a `chatId` with `checkAccount` and then sends to that id. That is how a MAX reply lands in the same chat.

## API calls

- `getStateInstance` — checks that the instance is authorized
- `checkAccount` — chat id for a phone number
- `sendMessage` — sends text
- `receiveNotification` and `deleteNotification` — reads the reply from the HTTP API queue

Only incoming text messages are shown. Other notifications are removed from the queue so it does not get stuck.

## Build

```bash
npm run build
npm run preview
```
