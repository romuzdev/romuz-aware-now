import { NavLink } from '@/core/components/navigation/NavLink';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  ClipboardCheck, 
  Award, 
  BarChart3,
  FileText
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

const adminItems = [
  {
    title: 'لوحة التحكم',
    url: '/lms',
    icon: LayoutDashboard,
  },
  {
    title: 'الدورات التدريبية',
    url: '/lms/courses',
    icon: BookOpen,
  },
  {
    title: 'التسجيلات',
    url: '/lms/enrollments',
    icon: Users,
  },
  {
    title: 'الاختبارات',
    url: '/lms/assessments',
    icon: ClipboardCheck,
  },
  {
    title: 'قوالب الشهادات',
    url: '/lms/certificates/templates',
    icon: Award,
  },
  {
    title: 'التقارير',
    url: '/lms/reports',
    icon: BarChart3,
  },
];

export function AdminSidebar() {
  const { open } = useSidebar();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>نظام إدارة التدريب</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === '/lms'}
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
