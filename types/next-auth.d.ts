import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name: string;
    role: "admin" | "client";
    clientSlug?: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: "admin" | "client";
      clientSlug?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "admin" | "client";
    clientSlug?: string;
  }
}
