/**
 * The only import path anything outside `src/core/rules/tide/` may use (ADR 006 §1).
 */
export type { TideStation, TidePredictionSample, TidePredictionSeries } from "./source";
export { tideSeries } from "./source";

export { heightAt, rateAt } from "./height";
export { turnsIn, nextTurnAfter, previousTurnBefore, nextSlackAfter } from "./turns";
export type { TideTurn, SlackWindow } from "./turns";
export { dailyRange, readTideAt } from "./state";
export type { TideMotion, TideReading } from "./index-types";
export { paceAt } from "./pace";
export type { PaceClass, TidePace } from "./pace";
export type { TideReadOptions } from "./constants";
export { RATE_WINDOW, SLACK_BELOW, NEAR_SLACK_BELOW } from "./constants";
