import { NavLink } from '@/core/components/navigation/NavLink';
import { 
  LayoutDashboard, 
  BookOpen, 
  Award,
  GraduationCap
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/core/components/ui/sidebar';

const employeeItems = [
  {
    title: 'لوحة التحكم',
    url: '/employee',
    icon: LayoutDashboard,
  },
  {
    title: 'دوراتي',
    url: '/employee/courses',
    icon: BookOpen,
  },
  {
    title: 'شهاداتي',
    url: '/employee/certificates',
    icon: Award,
  },
];

export function EmployeeSidebar() {
  const { open } = useSidebar();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            <GraduationCap className="h-4 w-4 ml-2 inline" />
            {open && 'منصة التعليم'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {employeeItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === '/employee'}
                      className="hover:bg-accent"
                      activeClassName="bg-accent text-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
