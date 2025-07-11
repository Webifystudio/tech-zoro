
"use client";

import { Sidebar, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarContent } from '@/components/ui/sidebar';
import { LayoutDashboard, ShieldCheck, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

const menuItems = [
    { href: `/admin`, label: 'Dashboard', icon: LayoutDashboard },
    { href: `/admin/access`, label: 'Access', icon: ShieldCheck },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
      await signOut(auth);
      router.push('/login');
  }

  return (
    <Sidebar>
        <SidebarHeader>
            <Link href="/admin" className="flex items-center gap-2 p-2">
              <h1 className="text-2xl font-bold tracking-tight text-primary cursor-pointer" style={{fontFamily: "'Brush Script MT', 'Cursive'"}}>ZORO ADMIN</h1>
            </Link>
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
        <div className="p-2 mt-auto">
             <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton onClick={handleLogout} tooltip="Logout">
                        <LogOut />
                        <span>Logout</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </div>
    </Sidebar>
  )
}
