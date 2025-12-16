/** @jsxImportSource react */
import { Icon } from '@chakra-ui/react';
import { MdPerson, MdDashboard } from 'react-icons/md';
import type { ReactNode, ReactElement } from 'react';

export interface SidebarItemInfo {
  name: ReactNode;
  path: string;
  icon: ReactElement;
}

const items: SidebarItemInfo[] = [
  {
    name: 'Dashboard',
    path: '/dash',
    icon: <Icon as={MdDashboard} />,
  },
  {
    name: 'Profile',
    path: '/dash/profile',
    icon: <Icon as={MdPerson} />,
  },
];

export default items;
