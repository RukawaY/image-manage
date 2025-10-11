# image-manage
Project for B/S architecture software design.

## How to run

```sh
sudo docker compose up -d --build
```

**NOTE:** If initialize for the first time, conduct database migration command:

```sh
sudo docker compose exec backend python manage.py migrate
```