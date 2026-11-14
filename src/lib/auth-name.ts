// Accounts are identified by first + last name; auth needs an email, so derive one.
export function nameToEmail(first: string, last: string) {
  const n = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${n(first)}.${n(last)}@evolution.local`;
}
