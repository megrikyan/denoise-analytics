# Доступ к Altegio для аналитики

## Зачем подключать

Google Ads и GA4 фиксируют действия в браузере, но не знают итог посещения.
Altegio должен быть источником истины для следующих показателей:

- всего записей, online-записей и записей новых клиентов;
- подтверждённые визиты, состоявшиеся визиты, отмены/no-show;
- фактическая выручка и средний чек;
- загрузка расписания;
- источники записей.

Это позволит показывать владельцу расходы рядом с операционным результатом, а
не называть клики выручкой.

## Текущее состояние

В `/opt/denoise-app/backend/app/.env` есть работающие partner token, user token и
company ID. Они используются production-формой. После активации приложения
`1591` для location `1165045` повторная проверка 15 сентября 2026 показала
доступ к Analytics & Reports и чтению appointments: production API возвращает
`200`.

Секреты booking-проекта не следует напрямую монтировать в analytics container.
Для analytics создан отдельный secret-файл, но сейчас в нём используется копия
system-user token приложения формы. Это временная конфигурация: изменение прав
этого пользователя влияет и на запись клиентов. Следует создать отдельное
Altegio-приложение или отдельный read-only user token для панели. Partner token
может принадлежать тому же developer account, но секрет должен храниться в
`/opt/denoise-analytics/secrets` и не попадать в Git.

Проверенные показатели за 15.09.2025–14.09.2026: 2 499 записей, 1 196
online-записей, 1 955 состоявшихся визитов, 466 отмен, 53 no-show, €190 175,07
выручки, средний чек €98,23 и загрузка 42,6%. Контакты клиентов не извлекались.

## Минимальные возможности пользователя

- read Analytics & Reports;
- read appointments, включая статусы удалённых/отменённых записей, без права
  создания или изменения;
- read visits and financial totals, если агрегированный revenue endpoint не
  даёт нужной детализации;
- read services and team members;
- без доступа к экспорту клиентской базы и без необходимости хранить PII.

## Предпочтительные read-only endpoints

- `GET /company/{location_id}/analytics/overall`;
- `GET /company/{location_id}/analytics/overall/charts/income_daily`;
- `GET /company/{location_id}/analytics/overall/charts/records_daily`;
- `GET /company/{location_id}/analytics/overall/charts/record_source`;
- `GET /company/{location_id}/analytics/overall/charts/record_status`;
- `GET /company/{location_id}/analytics/overall/charts/fullness_daily`.
- `GET /accounts/{location_id}` — классификация счетов: наличные/безналичные;
- `GET /transactions/{location_id}` — только для суммирования положительных
  оплат по счёту; клиентские поля отбрасываются и не сохраняются.

Эти методы возвращают агрегаты и не требуют передавать в панель контакты
клиентов. Официальное описание Business Management API:
https://developer.alteg.io/en/b2b-v1/openapi

## Архитектура подключения

```text
Altegio aggregate reports (read-only)
  -> denoise-analytics provider
  -> short in-memory cache / later daily snapshots
  -> owner dashboard
```

На первом этапе панель не должна запрашивать и сохранять имена, телефоны или
email. Для будущей сквозной атрибуции форма сохраняет только advertising click
ID/UTM и связывает их с числовым booking reference.
