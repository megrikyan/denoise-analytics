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

Файл должен иметь права `0600`, каталог — `0700`. Не отправляйте ключ в чат и не добавляйте его в Git.

## Google Analytics 4

В GA4 откройте **Admin → Property access management**, добавьте email service account с ролью Viewer и сообщите числовой `Property ID`. Панель использует Analytics Data API и не изменяет property.

Официальная инструкция: https://developers.google.com/analytics/devguides/reporting/data/v1/quickstart

## Search Console

Добавьте email service account пользователем property `sc-domain:denoisebcn.com` с правом чтения. Если в аккаунте используется только URL-prefix property, нужно сообщить точный адрес вместе с завершающим `/`.

Официальная авторизация: https://developers.google.com/webmaster-tools/v1/how-tos/authorizing

## Google Ads

Нужны:

- Customer ID рекламного аккаунта;
- Manager Customer ID, если доступ идёт через manager account;
- developer token с доступом к production;
- доступ service account к рекламному или manager account.

Google Ads требует одновременно OAuth/service-account credentials и developer token. Панель использует Google Ads API `v25` и только отчётные `SELECT`-запросы.

Официальная инструкция: https://developers.google.com/google-ads/api/docs/get-started/make-first-call

## Переменные окружения

После выдачи доступов скопируйте `.env.example` в `.env` и заполните:

```text
GA4_PROPERTY_ID
SEARCH_CONSOLE_SITE_URL
GOOGLE_ADS_CUSTOMER_ID
GOOGLE_ADS_LOGIN_CUSTOMER_ID
GOOGLE_ADS_DEVELOPER_TOKEN
```
