# Первичный аудит tracking — 15 сентября 2026

## Проверено публично

- Основной сайт: `https://denoisebcn.com/` (Tilda).
- GTM container: `GTM-NNBSQDT2`.
- Google Ads destination: `AW-16608461643`.
- GA4 destinations: `G-N633FDVBH6` и `G-TFKJTBTJKV`.
- Виджет публикует `denoise_booking_success` только после подтверждённого создания записи в Altegio.
- Событие содержит booking reference, услугу, специалиста, дату/время, value и `EUR`; имя, телефон и email в `dataLayer` не передаются.

Полученные идентификаторы:

- GA account ID: `318135024`;
- основной GA4 property ID: `446056209`;
- основной web stream: `DENOISE`, stream ID `8262999383`, measurement ID `G-N633FDVBH6`;
- `G-TFKJTBTJKV` относится к прежнему сценарию записи на стороне Altegio и является кандидатом на удаление из основного сайта;
- Google Ads customer ID: `214-463-1342`;
- Search Console property ещё не создан и временно исключён из подключения.

## Что видно в опубликованном GTM container

- На `denoise_booking_success` запускается отдельная Google Ads conversion action с label `XPCVCK2BhIIaEMuGxO89`.
- На том же событии включён сбор user-provided data: email извлекается CSS-селектором из экрана успешной записи для Enhanced Conversions.
- В контейнере опубликовано не менее 11 Ads conversion tags, преимущественно на клики по меню, контактам, Instagram, WhatsApp и кнопкам записи.
- Одновременно загружаются две GA4 destinations. Без доступа к GA4 пока нельзя определить, это два разных property, связанный destination или ошибочное дублирование.

## Риски и вопросы

1. На публичной HTML-странице не обнаружены CMP/banner и начальные команды Consent Mode v2. Это нужно проверить в браузере и в GTM Preview до любых новых рекламных интеграций.
2. Enhanced Conversions извлекает email из DOM. Нужно подтвердить основание и consent signal `ad_user_data`, а также проверить diagnostics Google Ads.
3. Большое число click-conversions может завышать бизнес-результат, если они отмечены primary и участвуют в bidding.
4. Событие записи технически корректное, но требуется сверка GA4 DebugView/Realtime, Ads diagnostics и фактической записи в Altegio.
5. Виджет пока не передаёт собственные этапы воронки (открытие, выбор услуги, выбор слота, ошибка). Из-за этого нельзя объяснить, где теряются потенциальные клиенты.

## Следующая проверка после выдачи доступов

- Admin API/интерфейс GA4: property, streams, key events, Ads links, data retention, unwanted referrals и cross-domain.
- Google Ads: conversion actions, primary/secondary, attribution, counting, windows, values, campaign goals, search terms, negatives, geo/language, budgets и bidding.
- Search Console: property coverage, sitemap, indexing, brand/non-brand queries, countries, devices and landing pages.
- Один контролируемый тестовый booking от входа с размеченной ссылки до Altegio, GA4 и Google Ads.

## API-аудит после подключения

Service account успешно читает production property GA4 и Google Ads customer. Уровень Explorer подтверждён фактическим запросом к production-аккаунту.

За последние 30 полных дней панель получила:

- GA4: 1 726 sessions, 1 334 users, 243 key events;
- Google Ads: €1 207,37 cost, 39 279 impressions, 1 410 clicks, 9 conversions и €1 150 conversion value;
- три активные кампании: `DeNoise Search ES`, `Performance Max EN`, `Search. Color Bar. EN`.

Все 243 GA4 key events относятся к старому хосту `n1218825.alteg.io`:

- `master_selected`: 162;
- `booked`: 54;
- `Schedule`: 27.

`denoise_booking_success` в основном GA4 property не зарегистрирован. Опубликованный GTM отправляет это событие в Google Ads conversion action, но не отправляет GA4 event.

Google Ads attribution за проверенное 30-дневное окно:

- `Thank You Page`: 7 conversions × default €150 = €1 050;
- старая импортированная `DENOISE (web) booked`: 2 conversions × default €50 = €100.

Текущий GTM не передаёт в Ads conversion tag динамические `value`, `currency` и `booking_reference` как transaction ID, хотя виджет публикует эти поля. Из-за этого conversion value не отражает выбранную услугу и не защищена transaction ID от повторного учёта.

Все три активные кампании используют `MAXIMIZE_CONVERSION_VALUE` с target ROAS 400–420%. Пока ценность конверсий фиксированная и одновременно учитывается старая Altegio-конверсия, менять бюджеты или target ROAS нельзя.

Среди primary/biddable целей также находятся клики по кнопке записи, контактам, Instagram, WhatsApp, Subscribe и YouTube interactions. Они должны быть пересмотрены как secondary-наблюдения; основными бизнес-целями должны остаться подтверждённая запись и, если бизнес считает их полноценными лидами, звонки.

Для чтения GA4 key events и stream settings через API дополнительно требуется включить Google Analytics Admin API в Cloud project `denoise-analytics`.
