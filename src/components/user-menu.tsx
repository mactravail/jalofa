"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  ShieldCheck,
  User,
} from "lucide-react";

import { signOut } from "@/lib/actions/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ADMIN_ROOT, ADMIN_TITLE } from "@/lib/admin-nav";
import { ROLE_LABELS, type UserRole } from "@/lib/constants";
import { DASHBOARD_ROOT, DASHBOARD_TITLE, type ProRole } from "@/lib/dashboard-nav";

type Props = {
  fullName: string | null;
  role: UserRole;
};

const isPro = (role: UserRole): role is ProRole =>
  role === "tailor" || role === "vendor";

export function UserMenu({ fullName, role }: Props) {
  const initials = (fullName ?? "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" className="h-9 gap-2 px-2" />}
      >
        <Avatar className="size-7">
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span className="hidden max-w-28 truncate text-sm sm:inline">
          {fullName ?? "Mon compte"}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col">
          <span className="truncate text-sm">{fullName ?? "Mon compte"}</span>
          <span className="text-muted-foreground text-xs font-normal">
            {ROLE_LABELS[role]}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/compte" />}>
          <User className="size-4" /> Mon compte
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/compte/commandes" />}>
          <Package className="size-4" /> Mes commandes
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/compte/adresses" />}>
          <MapPin className="size-4" /> Mes adresses
        </DropdownMenuItem>
        {isPro(role) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href={DASHBOARD_ROOT[role]} />}>
              <LayoutDashboard className="size-4" /> {DASHBOARD_TITLE[role]}
            </DropdownMenuItem>
          </>
        )}
        {role === "admin" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href={ADMIN_ROOT} />}>
              <ShieldCheck className="size-4" /> {ADMIN_TITLE}
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => signOut()}>
          <LogOut className="size-4" /> Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
