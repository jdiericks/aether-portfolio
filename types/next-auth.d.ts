import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name: string;
    role: "admin" | "client";
    clientSlug?: string;
    teamRoleId?: string | null;
    teamRoleName?: string | null;
    isOwner?: boolean;
    permissions?: string[];
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: "admin" | "client";
      clientSlug?: string;
      teamRoleId?: string | null;
      teamRoleName?: string | null;
      isOwner?: boolean;
      permissions?: string[];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "admin" | "client";
    clientSlug?: string;
    teamRoleId?: string | null;
    teamRoleName?: string | null;
    isOwner?: boolean;
    permissions?: string[];
  }
}
