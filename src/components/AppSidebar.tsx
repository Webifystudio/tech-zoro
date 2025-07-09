"use client";

import { Sidebar, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarContent } from '@/components/ui/sidebar';
import { LayoutDashboard, Settings, Globe } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';

export function AppSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const appId = params.appId as string;

  const menuItems = [
    { href: `/app/${appId}`, label: 'Dashboard', icon: LayoutDashboard },
    { href: `/app/${appId}/settings`, label: 'Settings', icon: Settings },
  ];

  return (
    <Sidebar>
        <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
              <Globe className="w-8 h-8 text-primary" />
              <h2 className="text-lg font-semibold text-primary truncate">App Dashboard</h2>
            </div>
        </SidebarHeader>
        <SidebarContent>
            <SidebarMenu>
                {menuItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                        <Link href={item.href} passHref>
                            <SidebarMenuButton isActive={pathname === item.href} tooltip={item.label}>
                                <item.icon />
                                <span>{item.label}</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarContent>
    </Sidebar>
  )
}
