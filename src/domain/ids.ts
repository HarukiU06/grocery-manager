let counter = 0;

/** Readable, collision-resistant ID: prefix, base36 time, counter and random tail. */
export function newId(prefix: string): string {
  counter = (counter + 1) % 1296;
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${time}${counter.toString(36).padStart(2, '0')}${rand}`;
}
