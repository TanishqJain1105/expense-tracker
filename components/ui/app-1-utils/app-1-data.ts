/**
 * Shared sidebar data.
 *
 * Avatars are deliberately omitted rather than pointed at stock photo URLs:
 * a remote image that 404s renders as a broken box, and AvatarFallback
 * already shows initials. Pass an `avatar` here if you have real assets.
 */
export interface App1Person {
  name: string;
  initials: string;
  avatar?: string;
}

export const app1User: App1Person = {
  name: "Tanishq Jain",
  initials: "TJ",
};
