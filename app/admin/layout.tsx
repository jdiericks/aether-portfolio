"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Users, Globe, Home, Link2, LogOut, Building2, MessageSquare, Settings, Share2, Menu, BarChart3, FileText, Star, Route, ChevronDown, ShieldCheck } from "lucide-react";

type NavChild = {
  name: string;
  href: string;
  icon: typeof Home;
  permission?: string;
};

type NavItem = {
  name: string;
  href: string;
  icon: typeof Home;
  permission?: string;
  children?: NavChild[];
};

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/admin", icon: Home, permission: "dashboard.view" },
  { name: "Properties", href: "/admin/listings", icon: Building2, permission: "listings.view" },
  { name: "Social", href: "/admin/social-posts", icon: Share2, permission: "social.view" },
  { name: "Inquiries", href: "/admin/inquiries", icon: MessageSquare, permission: "inquiries.view" },
  { name: "Clients", href: "/admin/clients", icon: Users, permission: "clients.view" },
  { name: "Team", href: "/admin/team", icon: ShieldCheck, permission: "team.view" },
  {
    name: "Website",
    href: "/admin/website",
    icon: Globe,
    children: [
      { name: "Website Settings", href: "/admin/website", icon: Globe, permission: "website.manage" },
      { name: "Content", href: "/admin/content", icon: FileText, permission: "content.view" },
      { name: "Testimonials", href: "/admin/testimonials", icon: Star, permission: "testimonials.manage" },
      { name: "Insights", href: "/admin/insights", icon: BarChart3, permission: "insights.view" },
      { name: "Redirects", href: "/admin/redirects", icon: Route, permission: "redirects.manage" },
      { name: "Integrations", href: "/admin/integrations", icon: Link2, permission: "integrations.manage" },
    ],
  },
];

function permitted(
  isOwner: boolean | undefined,
  permissions: string[] | undefined,
  permission?: string,
) {
  if (!permission) return true;
  if (isOwner) return true;
  return (permissions ?? []).includes(permission);
}

function isNavItemActive(pathname: string, item: NavItem) {
  if (pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))) {
    return true;
  }

  return item.children?.some(
    (child) => pathname === child.href || pathname.startsWith(child.href)
  ) ?? false;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // Pre-teams-feature sessions don't carry a permissions array yet. The JWT
  // callback will refresh it on the next request, but until that propagates we
  // grant the full nav to any admin so they're never locked out of their own
  // dashboard. Once `permissions` is populated, fine-grained gating kicks in.
  const sessionUser = session?.user;
  const hasTeamPermissionsLoaded =
    sessionUser?.role === "admin" && Array.isArray(sessionUser.permissions);
  const isOwner = sessionUser?.isOwner;
  const permissions = sessionUser?.permissions;

  const visibleNavigation = navigation
    .map((item) => {
      if (!hasTeamPermissionsLoaded) {
        return item;
      }
      const children = item.children?.filter((c) => permitted(isOwner, permissions, c.permission));
      const itemAllowed = permitted(isOwner, permissions, item.permission);
      if (item.children) {
        if (!children || children.length === 0) return null;
        return { ...item, children };
      }
      return itemAllowed ? item : null;
    })
    .filter((item): item is NavItem => item != null);

  return (
    <div className="min-h-screen bg-muted/30">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex items-center gap-8">
              <Sheet>
                <SheetTrigger asChild className="sm:hidden">
                  <Button variant="ghost" size="icon" aria-label="Open admin menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] p-0">
                  <SheetHeader className="border-b p-6 text-left">
                    <SheetTitle>Admin Menu</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-1 p-4">
                    {visibleNavigation.map((item) => {
                      const Icon = item.icon;
                      const isActive = isNavItemActive(pathname, item);
                      return (
                        <div key={item.name} className="space-y-1">
                          <Link
                            href={item.href}
                            className={cn(
                              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                              isActive
                                ? "bg-muted text-foreground"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            {item.name}
                          </Link>
                          {item.children && (
                            <div className="ml-6 flex flex-col gap-1 border-l pl-2">
                              {item.children.map((child) => {
                                const ChildIcon = child.icon;
                                const childIsActive = pathname === child.href || pathname.startsWith(child.href);
                                return (
                                  <Link
                                    key={child.name}
                                    href={child.href}
                                    className={cn(
                                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                                      childIsActive
                                        ? "bg-muted text-foreground"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                  >
                                    <ChildIcon className="h-4 w-4" />
                                    {child.name}
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </SheetContent>
              </Sheet>
              <Link href="/admin" className="flex items-center gap-2">
                <Building2 className="h-6 w-6" />
                <span className="font-semibold">Real Estate Admin</span>
              </Link>
              <div className="hidden sm:flex sm:gap-1">
                {visibleNavigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = isNavItemActive(pathname, item);
                  if (item.children) {
                    return (
                      <DropdownMenu key={item.name}>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className={cn(
                              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                              isActive
                                ? "bg-muted text-foreground"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            {item.name}
                            <ChevronDown className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          {item.children.map((child) => {
                            const ChildIcon = child.icon;
                            return (
                              <DropdownMenuItem key={child.name} asChild className="cursor-pointer">
                                <Link href={child.href}>
                                  <ChildIcon className="mr-2 h-4 w-4" />
                                  {child.name}
                                </Link>
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    );
                  }
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
                View Site
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {session?.user?.name?.charAt(0) || "A"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/admin/account">
                      <Settings className="mr-2 h-4 w-4" />
                      Account Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/admin/login" })}
                    className="cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>
      <main className="pt-16">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
