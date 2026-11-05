# Splitbill

Splitbill is an expense-sharing application with authentication, groups, expenses, and settlements.

## Getting started

### Requirements

- Node.js and npm
- A reachable MongoDB database

### Install dependencies

```powershell
npm ci
```

### Configure environment variables

Create a `.env` file in the project root. Do not commit credentials or share the file.

```dotenv
DATABASE_URL="<your-mongodb-connection-string>"
JWT_SECRET="<a-long-random-secret>"
```

`DATABASE_URL` is used by Prisma and by the native MongoDB helper in `lib/mongodb.ts`. If it is unset, the helper falls back to a local MongoDB URL.

Ensure the MongoDB database is reachable from your machine and, for MongoDB Atlas, that your IP address is allowed by the cluster's network access settings.

## Sync the MongoDB schema

This project uses Prisma's MongoDB connector. MongoDB does not use Prisma migration files, so use `db push` to apply the Prisma schema to the database:

```powershell
npx prisma db push
npx prisma generate
```

Run these commands from the project root after changing `prisma/schema.prisma`. `db push` needs a valid `DATABASE_URL` and a reachable database. `generate` creates the Prisma Client in `src/generated/prisma`.

## Windows: Prisma engine file is locked

If `npx prisma generate` fails with `EPERM` while renaming `query_engine-windows.dll.node`, stop the Next.js development server first by pressing **Ctrl+C** in its terminal, then retry generation. A running project process may have the Prisma engine loaded.

If the lock persists, inspect Node processes:

```powershell
Get-CimInstance Win32_Process -Filter "name = 'node.exe'" |
  Select-Object ProcessId, CommandLine
```

Stop only a process whose command line shows it belongs to this project, then retry `npx prisma generate`. Do not stop unrelated Node processes. Antivirus scanning may also briefly lock the generated engine; wait a moment and retry rather than disabling protection.

## Run the application

```powershell
npm run dev
```

For a production build and server:

```powershell
npm run build
npm start
```

## Contributing and branching

Use `main` for ongoing development and versioned `release/<major>.<minor>` branches for stabilization and maintenance. See the [branching strategy guide](docs/branching-strategy.md) for branch naming, release and patch workflows, and pull request checks.

## Frontend TODO

- Remove expenses
- Edit expenses UI
- Add a member to a group UI
- Edit and delete groups UI
- Group settlement page
- Refresh the group list after creating a group without reloading
- Refresh joined groups after joining without reloading

