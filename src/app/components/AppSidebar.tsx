import { Home, Trophy, Award, User, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from './ui/sidebar';
import logoImage from '../../imports/images.jfif';

const menuItems = [
  { icon: Home, label: 'Início', href: '/' },
  { icon: Trophy, label: 'Ranking', href: '/ranking' },
  { icon: Award, label: 'Conquistas', href: '#' },
  { icon: User, label: 'Perfil', href: '/profile' },
  { icon: Settings, label: 'Configurações', href: '#' },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2 py-4">
          <img 
            src={logoImage} 
            alt="QuestCode Logo" 
            className="w-12 h-12 rounded-lg"
          />
          <div>
            <h2 className="text-xl font-black bg-gradient-to-r from-blue-500 to-purple-700 bg-clip-text text-transparent">
              QuestCode
            </h2>
            <p className="text-xs text-gray-500">Aprenda codificando</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.href}>
                    <Link to={item.href}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <div className="px-3 py-2 text-xs text-gray-500">
          Versão 1.0.0
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}