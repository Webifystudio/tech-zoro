"use client";

import { Sidebar, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarContent } from '@/components/ui/sidebar';
import { LayoutDashboard, Settings, Globe, LayoutGrid, ShoppingBag, BarChart3, Megaphone, Palette, Wrench, Users2, ClipboardList, Share2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';

export function AppSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const appId = params.appId as string;

  const menuItems = [
    { href: `/app/${appId}`, label: 'Overview', icon: LayoutDashboard },
    { href: `/app/${appId}/storefront`, label: 'Storefront', icon: Globe },
    { href: `/app/${appId}/orders`, label: 'Orders', icon: ClipboardList },
    { href: `/app/${appId}/products`, label: 'Products', icon: ShoppingBag },
    { href: `/app/${appId}/categories`, label: 'Categories', icon: LayoutGrid },
    { href: `/app/${appId}/analytics`, label: 'Analytics', icon: BarChart3 },
    { href: `/app/${appId}/marketing`, label: 'Marketing', icon: Megaphone },
    { href: `/app/${appId}/customization`, label: 'Customization', icon: Palette },
    { href: `/app/${appId}/integrations`, label: 'Integrations', icon: Share2 },
    { href: `/app/${appId}/tools`, label: 'Tools', icon: Wrench },
    { href: `/app/${appId}/team`, label: 'Team', icon: Users2 },
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
