import type { RelayUserRecord, UserRole } from "../db/schema.js";

export class UserRegistry {
  private users = new Map<string, RelayUserRecord>();

  constructor() {
    // Seed initial team users including Sally Smith
    this.createUser({
      id: "usr_paddy",
      email: "paddy@paddy-systems.com",
      name: "Paddy",
      role: "OWNER",
      createdAt: Date.now() - 90 * 86400 * 1000,
    });

    this.createUser({
      id: "usr_sally",
      email: "sally@paddy-systems.com",
      name: "Sally Smith",
      role: "ADMIN",
      createdAt: Date.now(),
    });
  }

  public createUser(user: RelayUserRecord): RelayUserRecord {
    this.users.set(user.id, user);
    return user;
  }

  public getUser(id: string): RelayUserRecord | undefined {
    return this.users.get(id);
  }

  public getUserByEmail(email: string): RelayUserRecord | undefined {
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === email.toLowerCase()) {
        return user;
      }
    }
    return undefined;
  }

  public listUsers(): RelayUserRecord[] {
    return Array.from(this.users.values());
  }

  public updateUserRole(
    id: string,
    role: UserRole,
  ): RelayUserRecord | undefined {
    const user = this.users.get(id);
    if (!user) return undefined;
    user.role = role;
    return user;
  }
}

export const globalUserRegistry = new UserRegistry();
