import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "dayjs/locale/es";

dayjs.extend(utc);
dayjs.extend(timezone);

const SPAIN_TZ = "Europe/Madrid";

/**
 * Convierte una fecha UTC (de la BD) a hora de España
 * Para mostrar en inputs datetime-local
 */
export const utcToSpain = (isoString: string): string => {
  if (!isoString) return "";
  return dayjs.utc(isoString).tz(SPAIN_TZ).format("YYYY-MM-DDTHH:mm");
};

/**
 * Convierte una fecha en hora de España a UTC
 * Para enviar a la BD
 */
export const spainToUtc = (localDatetime: string): string => {
  if (!localDatetime) return "";
  return dayjs.tz(localDatetime, SPAIN_TZ).utc().toISOString();
};

/**
 * Formatea una fecha UTC a formato corto en hora de España
 * Ej: "29/01/2026 17:00h"
 */
export const formatSpainDateTime = (isoString: string): string => {
  if (!isoString) return "";
  return dayjs.utc(isoString).tz(SPAIN_TZ).format("DD/MM/YYYY hh:mm A");
};

/**
 * Convierte fecha de BD (texto sin timezone) a ISO string UTC
 * "2026-01-30 15:10:00.000" → "2026-01-30T15:10:00.000Z"
 */
export const dbDateToUtc = (dbDate: string): string => {
  if (!dbDate) return "";
  return dbDate.replace(" ", "T") + "Z";
};
