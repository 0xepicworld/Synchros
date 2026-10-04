/** Collision-resistant local id: time-sortable prefix + random suffix. */
export function newId(): string {
  const time = Date.now().toString(36);
  let rand = '';
  for (let i = 0; i < 10; i++) rand += Math.floor(Math.random() * 36).toString(36);
  return `${time}${rand}`;
}
