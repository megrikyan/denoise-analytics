# Доступы Google

## Один service account

Production service account:

```text
denoise-analytics-reader@denoise-analytics.iam.gserviceaccount.com
```

Создайте отдельный Google Cloud project, включите в нём:

1. Google Analytics Data API;
2. Google Search Console API;
3. Google Ads API.

Создайте service account и JSON key. JSON передаётся на сервер в:

```text
/opt/denoise-analytics/secrets/google-service-account.json
```

Каталог должен принадлежать группе контейнера `1000` с правами `0750`, а файл — `root:1000` с правами `0640`. Так ключ доступен только root и непривилегированному runtime-пользователю `node`. Не отправляйте ключ в чат и не добавляйте его в Git.

## Google Analytics 4

В GA4 откройте **Admin → Property access management**, добавьте email service account с ролью Viewer и сообщите числовой `Property ID`. Панель использует Analytics Data API и не изменяет property.

Production property:

```text
Property ID: 446056209
Stream: DENOISE / 8262999383 / G-N633FDVBH6
```

Analytics Data API подключён. Для программного аудита key events, data streams и связей необходимо также включить **Google Analytics Admin API** в том же Cloud project.

Официальная инструкция: https://developers.google.com/analytics/devguides/reporting/data/v1/quickstart

## Search Console

Добавьте email service account пользователем property `sc-domain:denoisebcn.com` с правом чтения. Если в аккаунте используется только URL-prefix property, нужно сообщить точный адрес вместе с завершающим `/`.

Официальная авторизация: https://developers.google.com/webmaster-tools/v1/how-tos/authorizing

## Google Ads

Нужны:

- Customer ID рекламного аккаунта;
- Manager Customer ID, если доступ идёт через manager account;
- доступ service account к рекламному или manager account.

С 9 сентября 2026 года developer token упразднён. Уровень API-доступа теперь назначается Google Cloud project, которому принадлежит service account. Для чтения production-аккаунта проект должен получить как минимум **Explorer access** на странице Google Ads API Overview в Cloud Console. Панель использует Google Ads API `v25` и только отчётные `SELECT`-запросы.

Production customer ID: `214-463-1342`.

Service account имеет Read-only access, а Explorer access подтверждён успешным production API-запросом.

Официальная инструкция: https://developers.google.com/google-ads/api/docs/get-started/make-first-call

## Переменные окружения

После выдачи доступов скопируйте `.env.example` в `.env` и заполните:

```text
GA4_PROPERTY_ID
SEARCH_CONSOLE_ENABLED
SEARCH_CONSOLE_SITE_URL
GOOGLE_ADS_CUSTOMER_ID
GOOGLE_ADS_LOGIN_CUSTOMER_ID
```
