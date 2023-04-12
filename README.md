# Satpam

Satpam is a secure and trusted password manager and 2FA. Built with [Next.js](https://nextjs.org/), [Prisma](https://www.prisma.io/), and [Mantine UI](https://mantine.dev/).

## Prerequisites

- [Node.js](https://nodejs.org/en/)
- [Yarn](https://yarnpkg.com/)
- [PostgreSQL](https://www.postgresql.org/)

## Installation

1. Clone the repository

    ```bash
    git clone git@github.com:mgilangjanuar/satpam.git && \
    cd satpam
    ```

2. Install dependencies

    ```bash
    yarn
    ```

3. Create [`.env`](#environment-variables) file

    ```bash
    cp .env.example .env
    ```

    Edit the `.env` file with your configuration.

4. Migrate database

    ```bash
    yarn prisma migrate deploy
    ```

5. Build and run the server

    ```bash
    yarn build && \
    yarn start
    ```

    Or, you can run the server in development mode

    ```bash
    yarn dev
    ```

## Environment Variables

| Name | Description | Default | Required |
| --- | --- | --- | --- |
| `DATABASE_URL` | Database URL | - | Yes |
| `SMTP_URL` | SMTP URL | - | Yes |
| `EMAIL_FROM` | Email sender | - | Yes |
| `BASE_URL` | Base URL | - | Yes |
| `SECRET_KEY` | Secret key | - | Yes |
| `ENCRYPT_KEY` | Encryption key | - | Yes |
| `SALT` | Salt | - | Yes |
| `DIGEST` | Digest algorithm | - | Yes |

## License

[MIT License](./LICENSE.md)