# Эксплуатация

## Production

- URL: `https://analytics.denoisebcn.com`;
- контейнер: `denoise-analytics`;
- внутренний порт: `8080`, наружу не публикуется;
- HTTPS gateway: Caddy из `/opt/denoise-app`;
- общая Docker-сеть: `denoise_public`.

## Проверка

```bash
cd /opt/denoise-analytics
./scripts/check.sh
```

Проверка валидирует Compose, устанавливает зависимости в одноразовый Docker volume, выполняет TypeScript build и тесты. Локальный `node_modules` не требуется.

## Развёртывание

```bash
cd /opt/denoise-analytics
./scripts/deploy.sh
```

После изменения `.env` или Google key контейнер нужно пересоздать той же командой.

## Секреты

- `.env` и каталог `secrets/` исключены из Git и Docker build context;
- `.env` должен иметь права `0600`;
- `secrets/` — `root:1000`, права `0750`;
- `secrets/google-service-account.json` — `root:1000`, права `0640`;
- пароль панели ротируется заменой `DASHBOARD_PASSWORD` в `.env` с последующим deploy.
- `ALTEGIO_WEBHOOK_PARTNER_TOKEN_SHA256` — SHA-256 от Partner Token приложения
  Altegio. Исходный токен в этом проекте не хранится.

## Altegio application webhook

- URL для Developer Account: `https://analytics.denoisebcn.com/api/webhooks/altegio`;
- endpoint принимает только `POST` с событиями `uninstall` и `freeze`;
- подлинность запроса проверяется по `partner_token` из payload без хранения самого
  токена;
- payload не сохраняется, персональные данные клиентов endpoint не принимает;
- при корректном запросе возвращается `204`, остальные методы/форматы отклоняются.

## Диагностика

```bash
docker compose -f /opt/denoise-analytics/infra/docker-compose.yml ps
docker compose -f /opt/denoise-analytics/infra/docker-compose.yml logs --tail=100 dashboard
curl -fsS https://analytics.denoisebcn.com/health
```

`/health` проверяет процесс без авторизации. `/ready` дополнительно показывает, какие Google sources настроены, но не раскрывает токены.
