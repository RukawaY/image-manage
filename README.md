# image-manage
Project for B/S architecture software design.

# How to run

## With Docker

### First Time Setup

- build image

```sh
sudo docker compose up -d --build
```

- database migration

```sh
sudo docker compose exec backend python manage.py migrate
```

### Start the Service

```sh
sudo docker compose up -d
```

### Stop the Service

```sh
sudo docker compose stop
```

### Restart after Modification

```sh
sudo docker compose down
sudo docker compose up -d --build
```

## Local Development

**NOTE:** Before start the service, make sure `mysql` is running and the database `image_manage` is created.

Start the service:

```sh
bash start.sh
```

Stop the service:

```sh
bash stop.sh
```