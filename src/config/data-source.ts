import "reflect-metadata";
import { DataSource } from "typeorm";
import { Config } from ".";
import path from "node:path";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: Config.DB_HOST,
    port: Number(Config.DB_PORT),
    username: Config.DB_USERNAME,
    password: Config.DB_PASSWORD,
    database: Config.DB_NAME,
    // Don't use this in production. Always keep false
    ssl: {
        rejectUnauthorized: false, // REQUIRED for Neon
    },
    synchronize: Config.NODE_ENV === "test",
    logging: false,
    entities: [path.join(__dirname, "../entities/*.{ts,js}")],
    migrations: [path.join(__dirname, "../migration/*.{ts,js}")],
    subscribers: [],
});
