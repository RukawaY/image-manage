# image-manage
Project for B/S architecture software design.

# How to run

# With Docker

```sh
sudo docker compose up -d --build
```

**NOTE:** If initialize for the first time, conduct database migration command:

```sh
sudo docker compose exec backend python manage.py migrate
```

# Local Development

**NOTE:** Before start the service, make sure `mysql` is running and the database `image_manage` is created.

Start the service:

```sh
bash start.sh
```

Stop the service:

```sh
bash stop.sh
```