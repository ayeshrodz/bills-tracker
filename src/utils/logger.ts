import { appConfig } from "../config";

type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const configuredLevel =
  (appConfig.logging?.level as LogLevel | undefined) ?? "info";

const shouldLog = (level: LogLevel) =>
  LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[configuredLevel];

const formatMessage = (level: LogLevel, message: string) =>
  `[${level.toUpperCase()}] ${message}`;

export const logger = {
  debug: (message: string, ...args: unknown[]) => {
    if (!shouldLog("debug")) return;
    console.debug(formatMessage("debug", message), ...args);
  },
  info: (message: string, ...args: unknown[]) => {
    if (!shouldLog("info")) return;
    console.info(formatMessage("info", message), ...args);
  },
  warn: (message: string, ...args: unknown[]) => {
    if (!shouldLog("warn")) return;
    console.warn(formatMessage("warn", message), ...args);
  },
  error: (message: string, ...args: unknown[]) => {
    if (!shouldLog("error")) return;
    console.error(formatMessage("error", message), ...args);
  },
};
