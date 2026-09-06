export function sessionVersionMatches(tokenVer: number | undefined, storedVer: number) {
  return storedVer === (tokenVer ?? 0);
}
