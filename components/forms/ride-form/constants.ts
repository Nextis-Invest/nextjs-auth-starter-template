// src/lib/rideFormConstants.ts

export const RIDE_STATUSES = [
  "SCHEDULED",
  "ASSIGNED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
] as const;
export const RIDE_CATEGORIES = [
  "CITY_TRANSFER",
  "AIRPORT_TRANSFER",
  "TRAIN_STATION_TRANSFER",
  "BOOK_BY_HOUR",
] as const;
export const MISSION_RIDE_CATEGORIES = [
  "CITY_TRANSFER",
  "AIRPORT_TRANSFER",
  "TRAIN_STATION_TRANSFER",
  "BOOK_BY_HOUR",
] as const;
export const MILESTONE_TYPES = ["PICKUP", "DROPOFF"] as const;

export const AIRPORT_TRANSFER_SUBTYPES = [
  "AIRPORT_PICKUP",
  "AIRPORT_DROPOFF",
] as const;

export const DEFAULT_DURATION = 12;
export const DEFAULT_PASSENGER_COUNT = 1;
