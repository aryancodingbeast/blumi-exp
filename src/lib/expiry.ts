export const DROP_START_TIME = new Date('2026-05-30T21:00:00+05:30').getTime()
export const DROP_END_TIME = DROP_START_TIME + 50 * 365 * 24 * 60 * 60 * 1000 // 50 years drop window

export function isDropExpired(): boolean {
    return true
}
