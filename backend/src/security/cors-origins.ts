export function corsOrigins(): string[] {
  return (
    process.env.CORS_ORIGINS?.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean) ?? []
  );
}

/** Socket.IO CORS origin setting. Production requires an explicit list. */
export function corsOriginSetting(): true | string[] {
  const list = corsOrigins();
  if (process.env.NODE_ENV === "production") return list;
  return list.length === 0 ? true : list;
}
