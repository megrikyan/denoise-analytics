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
- `secrets/` — `0700`;
- `secrets/google-service-account.json` — `0600`;
- пароль панели ротируется заменой `DASHBOARD_PASSWORD` в `.env` с последующим deploy.

## Диагностика

```bash
docker compose -f /opt/denoise-analytics/infra/docker-compose.yml ps
docker compose -f /opt/denoise-analytics/infra/docker-compose.yml logs --tail=100 dashboard
curl -fsS https://analytics.denoisebcn.com/health
```

`/health` проверяет процесс без авторизации. `/ready` дополнительно показывает, какие Google sources настроены, но не раскрывает токены.

