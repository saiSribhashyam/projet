'use client'

import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import useProject from "@/hooks/use-project";
import { cn } from "@/lib/utils";
import { Bot, CreditCard, LayoutDashboard, Plus, Presentation } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
    {
        title: 'Dashboard',
        url: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'Q&A',
        url: '/qa',
        icon: Bot,
    },
    {
        title: 'Meetings',
        url: '/meetings',
        icon: Presentation,
    },
    {
        title: 'Billing',
        url: '/billing',
        icon: CreditCard,
    },
];

export function AppSidebar() {
    const { open } = useSidebar();
    const pathname = usePathname();
    const { projects, projectId, setProjectId } = useProject();

    return (
        <Sidebar collapsible="icon" variant="floating">
            <SidebarHeader>
                <div className="flex items-center gap-2">
                    Logo
                    {open && <h1 className="text-xl font-bold text-primary/80">Projet</h1>}
                </div>
            </SidebarHeader>

            <SidebarContent>
                {/* Application Section */}
                <SidebarGroup>
                    <SidebarGroupLabel>Application</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <Link
                                            href={item.url}
                                            className={cn(
                                                { '!bg-primary !text-white': pathname === item.url },
                                                'list-none'
                                            )}
                                        >
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* Projects Section */}
                <SidebarGroup>
                    <SidebarGroupLabel>Your Projects</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {projects?.map((project) => (
                                <SidebarMenuItem key={project.id}>
                                    <SidebarMenuButton asChild>
                                        <div onClick={() => setProjectId(project.id)} className="flex items-center gap-2 cursor-pointer">
                                            <div
                                                className={cn(
                                                    'rounded-sm border size-6 flex items-center justify-center text-sm bg-white text-primary',
                                                    { 'bg-primary text-white': project.id === projectId }
                                                )}
                                            >
                                                {project.name[0]}
                                            </div>
                                            <span>{project.name}</span>
                                        </div>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}

                            {/* Spacing */}
                            <div className="h-2"></div>

                            {/* Create Project Button (Only visible when sidebar is open) */}
                            {open && (
                                <SidebarMenuItem>
                                    <Link href="/create">
                                        <Button variant="outline" size="sm" className="w-fit">
                                            Create Project <Plus />
                                        </Button>
                                    </Link>
                                </SidebarMenuItem>
                            )}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}
