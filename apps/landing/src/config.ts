/**
 * Where the landing page hands off to the corridor twin.
 *
 * Not hardcoded: the twin runs on a different origin to this page, so a literal
 * localhost URL would break the moment the site is built for anywhere but this machine.
 * Set VITE_TWIN_URL per environment; the default is the local dev port.
 */
export const TWIN_URL = import.meta.env.VITE_TWIN_URL ?? 'http://localhost:5195'
