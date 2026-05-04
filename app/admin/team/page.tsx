"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Trash2, Pencil, Users, Shield, ServerCog } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PERMISSIONS, PERMISSION_GROUPS, type PermissionKey } from "@/lib/permissions";
import { cn } from "@/lib/utils";

interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isOwner: boolean;
  permissions: string[];
  mcpAccess: "none" | "all" | "scoped";
  mcpAllowedTools: string[];
  _count?: { users: number };
  createdAt: string;
  updatedAt: string;
}

interface TeamUser {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  mcpAccess: "inherit" | "none" | "all" | "scoped";
  mcpAllowedTools: string[];
  roleId: string | null;
  role: { id: string; name: string; isOwner: boolean } | null;
  invitedBy: { id: string; name: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface McpToolDef {
  name: string;
  description: string;
  group: string;
  mutating: boolean;
}

const ACCESS_LABELS: Record<string, string> = {
  inherit: "Inherit from role",
  none: "No access",
  all: "All tools",
  scoped: "Scoped to specific tools",
};

export default function TeamPage() {
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [tools, setTools] = useState<McpToolDef[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingUser, setEditingUser] = useState<TeamUser | null>(null);
  const [creatingUser, setCreatingUser] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [creatingRole, setCreatingRole] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [u, r, t] = await Promise.all([
        fetch("/api/admin/team/users").then((res) => res.json()),
        fetch("/api/admin/team/roles").then((res) => res.json()),
        fetch("/api/admin/team/mcp-tools").then((res) => res.json()),
      ]);
      setUsers(u.users ?? []);
      setRoles(r.roles ?? []);
      setTools(t.tools ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load team data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toolsByGroup = useMemo(() => {
    const groups: Record<string, McpToolDef[]> = {};
    for (const tool of tools) {
      groups[tool.group] = groups[tool.group] ?? [];
      groups[tool.group].push(tool);
    }
    return groups;
  }, [tools]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Users className="h-6 w-6" /> Team
          </h1>
          <p className="text-muted-foreground">
            Manage who has access to the admin and the MCP server.
          </p>
        </div>
      </div>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">
            <Users className="mr-2 h-4 w-4" /> Members
          </TabsTrigger>
          <TabsTrigger value="roles">
            <Shield className="mr-2 h-4 w-4" /> Roles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setCreatingUser(true)}>
              <Plus className="mr-2 h-4 w-4" /> Invite member
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-medium uppercase text-muted-foreground">
                  <div className="col-span-3">Name</div>
                  <div className="col-span-3">Email</div>
                  <div className="col-span-2">Role</div>
                  <div className="col-span-2">MCP access</div>
                  <div className="col-span-1">Status</div>
                  <div className="col-span-1 text-right">Actions</div>
                </div>
                {users.length === 0 ? (
                  <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                    No team members yet. Invite your first one above.
                  </div>
                ) : (
                  users.map((user) => (
                    <div
                      key={user.id}
                      className="grid grid-cols-12 gap-4 items-center px-6 py-3 text-sm"
                    >
                      <div className="col-span-3 font-medium">{user.name}</div>
                      <div className="col-span-3 text-muted-foreground">{user.email}</div>
                      <div className="col-span-2">
                        {user.role ? (
                          <Badge variant={user.role.isOwner ? "default" : "secondary"}>
                            {user.role.name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground italic">No role</span>
                        )}
                      </div>
                      <div className="col-span-2 text-muted-foreground">
                        {ACCESS_LABELS[user.mcpAccess] ?? user.mcpAccess}
                      </div>
                      <div className="col-span-1">
                        {user.isActive ? (
                          <Badge variant="outline" className="text-green-700 border-green-300">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Disabled
                          </Badge>
                        )}
                      </div>
                      <div className="col-span-1 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingUser(user)}
                          aria-label={`Edit ${user.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setCreatingRole(true)}>
              <Plus className="mr-2 h-4 w-4" /> Create role
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {roles.map((role) => (
              <Card key={role.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {role.name}
                        {role.isOwner ? (
                          <Badge>Owner</Badge>
                        ) : role.isSystem ? (
                          <Badge variant="secondary">Built-in</Badge>
                        ) : null}
                      </CardTitle>
                      {role.description && (
                        <CardDescription>{role.description}</CardDescription>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingRole(role)}
                      disabled={role.isOwner}
                      aria-label={`Edit ${role.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      <Users className="mr-1 h-3 w-3" />
                      {role._count?.users ?? 0} member
                      {(role._count?.users ?? 0) === 1 ? "" : "s"}
                    </Badge>
                    <Badge variant="outline" className="font-mono text-xs">
                      <Shield className="mr-1 h-3 w-3" />
                      {role.isOwner
                        ? "All permissions"
                        : `${role.permissions.length} permission${role.permissions.length === 1 ? "" : "s"}`}
                    </Badge>
                    <Badge variant="outline" className="font-mono text-xs">
                      <ServerCog className="mr-1 h-3 w-3" />
                      {role.mcpAccess === "all"
                        ? "MCP: all tools"
                        : role.mcpAccess === "scoped"
                          ? `MCP: ${role.mcpAllowedTools.length} tools`
                          : "MCP: none"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {creatingUser && (
        <UserDialog
          tools={tools}
          toolsByGroup={toolsByGroup}
          roles={roles}
          onClose={() => setCreatingUser(false)}
          onSaved={() => {
            setCreatingUser(false);
            refresh();
          }}
        />
      )}
      {editingUser && (
        <UserDialog
          tools={tools}
          toolsByGroup={toolsByGroup}
          roles={roles}
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={() => {
            setEditingUser(null);
            refresh();
          }}
        />
      )}

      {creatingRole && (
        <RoleDialog
          tools={tools}
          toolsByGroup={toolsByGroup}
          onClose={() => setCreatingRole(false)}
          onSaved={() => {
            setCreatingRole(false);
            refresh();
          }}
        />
      )}
      {editingRole && (
        <RoleDialog
          tools={tools}
          toolsByGroup={toolsByGroup}
          role={editingRole}
          onClose={() => setEditingRole(null)}
          onSaved={() => {
            setEditingRole(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// User dialog
// ---------------------------------------------------------------------------

function UserDialog({
  user,
  roles,
  tools,
  toolsByGroup,
  onClose,
  onSaved,
}: {
  user?: TeamUser;
  roles: Role[];
  tools: McpToolDef[];
  toolsByGroup: Record<string, McpToolDef[]>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!user;
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState<string>(user?.roleId ?? roles[0]?.id ?? "");
  const [mcpAccess, setMcpAccess] = useState<TeamUser["mcpAccess"]>(
    user?.mcpAccess ?? "inherit",
  );
  const [allowedTools, setAllowedTools] = useState<Set<string>>(
    new Set(user?.mcpAllowedTools ?? []),
  );
  const [isActive, setIsActive] = useState(user?.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const toggleTool = (name: string) => {
    setAllowedTools((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name,
        email,
        roleId: roleId || null,
        mcpAccess,
        mcpAllowedTools: mcpAccess === "scoped" ? Array.from(allowedTools) : [],
        isActive,
      };
      if (password) payload.password = password;

      const url = isEdit
        ? `/api/admin/team/users/${user!.id}`
        : "/api/admin/team/users";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      toast.success(isEdit ? "Member updated" : "Member added");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!user) return;
    if (!confirm(`Remove ${user.name} from the team? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/team/users/${user.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to remove member");
      }
      toast.success("Member removed");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit member" : "Invite team member"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this member's role and MCP access."
              : "Create a new team member account. They can sign in immediately with the password you set."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="user-name">Name</Label>
              <Input id="user-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-password">
              {isEdit ? "Reset password (leave blank to keep current)" : "Initial password"}
            </Label>
            <Input
              id="user-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isEdit ? "Unchanged" : "At least 8 characters"}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={roleId} onValueChange={setRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="No role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>MCP access</Label>
              <Select
                value={mcpAccess}
                onValueChange={(v) => setMcpAccess(v as TeamUser["mcpAccess"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inherit">Inherit from role</SelectItem>
                  <SelectItem value="none">No access</SelectItem>
                  <SelectItem value="all">All tools</SelectItem>
                  <SelectItem value="scoped">Scoped to specific tools</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {mcpAccess === "scoped" && (
            <div className="space-y-2 border rounded-md p-3">
              <Label>Allowed MCP tools ({allowedTools.size} selected)</Label>
              <ToolPicker
                tools={tools}
                toolsByGroup={toolsByGroup}
                selected={allowedTools}
                onToggle={toggleTool}
              />
            </div>
          )}

          {isEdit && (
            <div className="flex items-center gap-3 border rounded-md p-3">
              <Switch
                id="user-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="user-active" className="cursor-pointer">
                {isActive ? "Active — can sign in" : "Disabled — cannot sign in"}
              </Label>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <div>
            {isEdit && (
              <Button
                variant="destructive"
                size="sm"
                onClick={remove}
                disabled={deleting || saving}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Remove
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving || !name || !email}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isEdit ? "Save changes" : "Create member"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Role dialog
// ---------------------------------------------------------------------------

function RoleDialog({
  role,
  tools,
  toolsByGroup,
  onClose,
  onSaved,
}: {
  role?: Role;
  tools: McpToolDef[];
  toolsByGroup: Record<string, McpToolDef[]>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!role;
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [permissions, setPermissions] = useState<Set<PermissionKey>>(
    new Set((role?.permissions ?? []) as PermissionKey[]),
  );
  const [mcpAccess, setMcpAccess] = useState<Role["mcpAccess"]>(role?.mcpAccess ?? "none");
  const [allowedTools, setAllowedTools] = useState<Set<string>>(
    new Set(role?.mcpAllowedTools ?? []),
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const togglePermission = (key: PermissionKey) => {
    setPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleGroup = (groupKeys: PermissionKey[], on: boolean) => {
    setPermissions((prev) => {
      const next = new Set(prev);
      for (const k of groupKeys) {
        if (on) next.add(k);
        else next.delete(k);
      }
      return next;
    });
  };

  const toggleTool = (n: string) => {
    setAllowedTools((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        name,
        description: description || null,
        permissions: Array.from(permissions),
        mcpAccess,
        mcpAllowedTools: mcpAccess === "scoped" ? Array.from(allowedTools) : [],
      };
      const url = isEdit
        ? `/api/admin/team/roles/${role!.id}`
        : "/api/admin/team/roles";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save role");
      toast.success(isEdit ? "Role updated" : "Role created");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save role");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!role) return;
    if (!confirm(`Delete the "${role.name}" role? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/team/roles/${role.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete role");
      }
      toast.success("Role deleted");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete role");
    } finally {
      setDeleting(false);
    }
  };

  const permissionGroups = useMemo(() => {
    const groups: Record<string, typeof PERMISSIONS> = {};
    for (const p of PERMISSIONS) {
      groups[p.group] = groups[p.group] ?? [];
      groups[p.group].push(p);
    }
    return groups;
  }, []);

  const isOwner = role?.isOwner ?? false;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `Edit role: ${role!.name}` : "Create role"}
          </DialogTitle>
          <DialogDescription>
            Roles bundle permissions across the admin and the MCP server. Assign one to each team member.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="role-name">Name</Label>
              <Input
                id="role-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isOwner}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-description">Description</Label>
              <Input
                id="role-description"
                value={description ?? ""}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isOwner}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Permissions</Label>
              <span className="text-xs text-muted-foreground">
                {permissions.size} of {PERMISSIONS.length} selected
              </span>
            </div>

            {PERMISSION_GROUPS.map((group) => {
              const groupPerms = permissionGroups[group] ?? [];
              const allOn = groupPerms.every((p) => permissions.has(p.key));
              return (
                <div key={group} className="border rounded-md p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">{group}</h4>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground"
                      onClick={() =>
                        toggleGroup(
                          groupPerms.map((p) => p.key),
                          !allOn,
                        )
                      }
                      disabled={isOwner}
                    >
                      {allOn ? "Deselect all" : "Select all"}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {groupPerms.map((p) => (
                      <label
                        key={p.key}
                        className={cn(
                          "flex items-start gap-2 cursor-pointer text-sm",
                          isOwner && "cursor-not-allowed opacity-60",
                        )}
                      >
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={permissions.has(p.key)}
                          onChange={() => togglePermission(p.key)}
                          disabled={isOwner}
                        />
                        <span>
                          <span className="font-medium">{p.label}</span>
                          <span className="block text-xs text-muted-foreground">
                            {p.description}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-3">
            <Label>MCP access</Label>
            <Select
              value={mcpAccess}
              onValueChange={(v) => setMcpAccess(v as Role["mcpAccess"])}
              disabled={isOwner}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No access</SelectItem>
                <SelectItem value="all">All MCP tools</SelectItem>
                <SelectItem value="scoped">Scoped to specific tools</SelectItem>
              </SelectContent>
            </Select>

            {mcpAccess === "scoped" && (
              <div className="border rounded-md p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Allowed tools ({allowedTools.size} selected)</Label>
                </div>
                <ToolPicker
                  tools={tools}
                  toolsByGroup={toolsByGroup}
                  selected={allowedTools}
                  onToggle={toggleTool}
                  disabled={isOwner}
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <div>
            {isEdit && !role!.isSystem && !role!.isOwner && (
              <Button
                variant="destructive"
                size="sm"
                onClick={remove}
                disabled={deleting || saving}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete role
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving || isOwner || !name}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isEdit ? "Save role" : "Create role"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Tool picker (used in both dialogs)
// ---------------------------------------------------------------------------

function ToolPicker({
  tools,
  toolsByGroup,
  selected,
  onToggle,
  disabled,
}: {
  tools: McpToolDef[];
  toolsByGroup: Record<string, McpToolDef[]>;
  selected: Set<string>;
  onToggle: (name: string) => void;
  disabled?: boolean;
}) {
  const groupOrder = useMemo(
    () => Array.from(new Set(tools.map((t) => t.group))),
    [tools],
  );

  const toggleAll = (groupTools: McpToolDef[]) => {
    const allOn = groupTools.every((t) => selected.has(t.name));
    for (const t of groupTools) {
      if (allOn) {
        if (selected.has(t.name)) onToggle(t.name);
      } else {
        if (!selected.has(t.name)) onToggle(t.name);
      }
    }
  };

  return (
    <div className="space-y-3 max-h-[300px] overflow-y-auto">
      {groupOrder.map((group) => {
        const groupTools = toolsByGroup[group] ?? [];
        const allOn = groupTools.every((t) => selected.has(t.name));
        return (
          <div key={group} className="space-y-1">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-semibold uppercase text-muted-foreground">
                {group}
              </h5>
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => toggleAll(groupTools)}
                disabled={disabled}
              >
                {allOn ? "Deselect all" : "Select all"}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
              {groupTools.map((tool) => (
                <label
                  key={tool.name}
                  className={cn(
                    "flex items-start gap-2 text-xs cursor-pointer",
                    disabled && "cursor-not-allowed opacity-60",
                  )}
                >
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={selected.has(tool.name)}
                    onChange={() => onToggle(tool.name)}
                    disabled={disabled}
                  />
                  <span>
                    <span className="font-mono">{tool.name}</span>
                    {tool.mutating && (
                      <Badge variant="outline" className="ml-1 text-[10px] py-0 px-1">
                        write
                      </Badge>
                    )}
                    <span className="block text-muted-foreground">{tool.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
