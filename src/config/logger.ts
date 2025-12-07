import winston from "winston";
import { Config } from ".";

const logger = winston.createLogger({
    // level of log type
    level: "info",

    // format of log defined
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
    ),

    // metadat want to store with log
    defaultMeta: {
        serviceName: "auth-service",
    },

    // storage of logs
    transports: [
        new winston.transports.File({
            level: "info",
            dirname: "logs",
            filename: "access.log",
            silent: Config.NODE_ENV === "test",
        }),
        new winston.transports.File({
            level: "error",
            dirname: "logs",
            filename: "error.log",
            silent: Config.NODE_ENV === "test",
        }),
    ],
});

export default logger;
