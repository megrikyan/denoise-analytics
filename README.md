# DE | NOISE Analytics

Закрытая управленческая панель для владельца салона. Она объединяет Google Ads, Google Analytics 4 и Google Search Console и переводит технические показатели в бизнес-метрики: расходы, записи, стоимость записи, ценность конверсий, посещаемость и органический спрос.

Проект отделён от `/opt/denoise-app`, потому что использует собственные Google-доступы, модель данных и цикл релизов. Сервис записи продолжает отвечать только за форму Tilda и Altegio.

## Состояние

- панель развёрнута и доступна только после авторизации;
- read-only Google API connectors реализованы;
- production-поддомен: `analytics.denoisebcn.com`;
- DNS `A`: `204.168.178.49`;
- TLS выпускается и обновляется автоматически через общий Caddy;
- GA4 и Google Ads подключены и возвращают production-данные;
- Search Console по решению владельца временно отложен;
- изменения рекламных кампаний через API намеренно не поддерживаются.

## Локальная проверка

```bash
./scripts/check.sh
```

## Документация

- [Архитектура](docs/architecture.md)
- [Эксплуатация](docs/operations.md)
- [Доступы Google](docs/google-access.md)
- [Модель метрик](docs/metrics.md)
- [Первичный аудит tracking](docs/tracking-audit-2026-09.md)
- [Аудит Google Ads](docs/ads-audit-2026-09.md)
