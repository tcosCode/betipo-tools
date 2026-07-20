declare namespace App {
  interface Locals {
    auth: () => { userId: string | null };
    user: { name: string | null; picture: string | null } | null;
  }
}
