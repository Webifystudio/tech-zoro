
"use client";

import { Sidebar, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarContent, SidebarSeparator } from '@/components/ui/sidebar';
import { LayoutDashboard, Settings, Globe, LayoutGrid, ShoppingBag, BarChart3, Megaphone, Palette, Wrench, Users2, ClipboardList, Share2, PackageX, Puzzle, Ticket, QrCode, FileText, Component, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useEffect, useState } from 'react';

const coreMenuItems = [
    { href: `/app/{appId}`, label: 'Overview', icon: LayoutDashboard },
    { href: `/app/{appId}/storefront`, label: 'Storefront', icon: Globe },
    { href: `/app/{appId}/orders`, label: 'Orders', icon: ClipboardList },
    { href: `/app/{appId}/products`, label: 'Products', icon: ShoppingBag },
    { href: `/app/{appId}/out-of-stock`, label: 'Out of Stock', icon: PackageX },
    { href: `/app/{appId}/categories`, label: 'Categories', icon: LayoutGrid },
    { href: `/app/{appId}/analytics`, label: 'Analytics', icon: BarChart3 },
];

const managementMenuItems = [
    { href: `/app/{appId}/customization`, label: 'Customization', icon: Palette },
    { href: `/app/{appId}/pages`, label: 'Pages', icon: FileText },
    { href: `/app/{appId}/marketing`, label: 'Marketing', icon: Megaphone },
    { href: `/app/{appId}/integrations`, label: 'Integrations', icon: Share2 },
    { href: `/app/{appId}/team`, label: 'Team', icon: Users2 },
    { href: `/app/{appId}/settings`, label: 'Settings', icon: Settings },
];

const availableExtensions = [
  { id: 'coupons', label: 'Coupons', icon: Ticket, href: '/app/{appId}/tools/coupons' },
  { id: 'qrcode', label: 'QR Code', icon: QrCode, href: '/app/{appId}/tools/qrcode' },
];

export function AppSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const appId = params.appId as string;
  
  const [installedExtensions] = useLocalStorage<string[]>(`installed_extensions_${appId}`, ['coupons']);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const handleStorageChange = () => {
       window.location.reload();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const renderMenuItems = (items: any[]) => {
    return items.map((item) => {
      const href = item.href.replace('{appId}', appId);
      return (
        <SidebarMenuItem key={href}>
            <Link href={href} passHref>
                <SidebarMenuButton isActive={pathname === href} tooltip={item.label}>
                    <item.icon />
                    <span>{item.label}</span>
                </SidebarMenuButton>
            </Link>
        </SidebarMenuItem>
      )
    });
  }

  const extensionsToRender = isClient ? availableExtensions.filter(ext => installedExtensions.includes(ext.id)) : [];

  return (
    <Sidebar>
        <SidebarHeader>
            <Link href="/" className="flex items-center gap-2 p-2">
              <h1 className="text-2xl font-bold tracking-tight text-primary cursor-pointer" style={{fontFamily: "'Brush Script MT', 'Cursive'"}}>ZORO</h1>
            </Link>
        </SidebarHeader>
        <SidebarContent>
            <SidebarMenu>
                {renderMenuItems(coreMenuItems)}

                <SidebarSeparator className="my-2"/>
                
                <SidebarMenuItem>
                    <Link href={`/app/${appId}/tools`} passHref>
                        <SidebarMenuButton isActive={pathname.startsWith(`/app/${appId}/tools`)} tooltip="Extensions">
                            <Puzzle />
                            <span>Extensions</span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>

                {isClient && renderMenuItems(extensionsToRender)}

                <SidebarSeparator className="my-2"/>

                {renderMenuItems(managementMenuItems)}
            </SidebarMenu>
        </SidebarContent>
    </Sidebar>
  )
}
