import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Inbox,
  CircleDot,
  KanbanSquare,
  View,
  MoreHorizontal,
  Plus,
  Github,
  HelpCircle,
  Users,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Define types for navigation items
interface NavItemProps {
  title: string;
  icon: React.ElementType;
  href: string;
  isActive?: boolean;
  subItems?: NavItemProps[];
}

interface NavSectionProps {
  title?: string;
  isCollapsible?: boolean;
  defaultOpen?: boolean;
  items: NavItemProps[];
}

// Data for the sidebar navigation
const navSections: NavSectionProps[] = [
  {
    items: [
      { title: 'Inbox', icon: Inbox, href: '#', isActive: false },
      { title: 'My issues', icon: CircleDot, href: '#', isActive: false },
    ],
  },
  {
    title: 'Workspace',
    isCollapsible: true,
    defaultOpen: true,
    items: [
      { title: 'Projects', icon: KanbanSquare, href: '#', isActive: false },
      { title: 'Views', icon: View, href: '#', isActive: false },
      { title: 'More', icon: MoreHorizontal, href: '#', isActive: false },
    ],
  },
  {
    title: 'Your teams',
    isCollapsible: true,
    defaultOpen: true,
    items: [
      {
        title: 'Numbly',
        icon: Users,
        href: '#',
        isActive: false,
        subItems: [
          { title: 'Issues', icon: CircleDot, href: '#', isActive: true },
          { title: 'Projects', icon: KanbanSquare, href: '#', isActive: false },
          { title: 'Views', icon: View, href: '#', isActive: false },
        ],
      },
    ],
  },
  {
    title: 'Try',
    isCollapsible: true,
    defaultOpen: true,
    items: [
      { title: 'Import issues', icon: Download, href: '#', isActive: false },
      { title: 'Invite people', icon: Plus, href: '#', isActive: false },
      { title: 'Link GitHub', icon: Github, href: '#', isActive: false },
    ],
  },
];

// Component for a single navigation item
const NavItem: React.FC<{ item: NavItemProps; isSubItem?: boolean }> = ({ item, isSubItem = false }) => (
  <a
    href={item.href}
    className={cn(
      'group flex items-center py-1.5 px-3 rounded-md text-sm font-medium transition-colors',
      isSubItem ? 'pl-10' : 'pl-3',
      item.isActive
        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
        : 'text-muted-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50'
    )}
  >
    <item.icon className={cn('mr-3 h-4 w-4', item.isActive ? 'text-sidebar-accent-foreground' : 'text-muted-foreground group-hover:text-sidebar-accent-foreground')} />
    <span>{item.title}</span>
  </a>
);

// Component for a collapsible section
const CollapsibleSection: React.FC<{ section: NavSectionProps }> = ({ section }) => {
  const [isOpen, setIsOpen] = useState(section.defaultOpen);

  return (
    <div>
      {section.title && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase"
        >
          <span>{section.title}</span>
          {section.isCollapsible && (
            isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
          )}
        </button>
      )}
      {isOpen && (
        <div className="space-y-1">
          {section.items.map((item) => (
            <div key={item.title}>
              <NavItem item={item} />
              {item.subItems && (
                <div className="space-y-1 mt-1">
                  {item.subItems.map((subItem) => (
                    <NavItem key={subItem.title} item={subItem} isSubItem />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Main Sidebar Component
export default function Sidebar({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border', className)}>
      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-4 overflow-y-auto">
        {navSections.map((section, index) => (
          <CollapsibleSection key={index} section={section} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-sidebar-border">
        <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50">
          <HelpCircle className="mr-3 h-4 w-4" />
          <span className="text-sm font-medium">Help</span>
        </Button>
      </div>
    </div>
  );
}
