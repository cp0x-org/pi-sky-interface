// assets
import { IconKey, IconReceipt2, IconBug, IconBellRinging, IconPhoneCall, IconQuestionMark, IconShieldLock } from '@tabler/icons-react';
import { NavItemType } from 'types';

// constant
const icons = {
  IconKey,
  IconReceipt2,
  IconBug,
  IconBellRinging,
  IconPhoneCall,
  IconQuestionMark,
  IconShieldLock
};

// ==============================|| EXTRA PAGES MENU ITEMS ||============================== //

const pages: NavItemType = {
  id: 'pages',
  title: 'pages',
  caption: 'pages-caption',
  icon: icons.IconKey,
  type: 'group',
  children: [
    {
      id: 'maintenance',
      title: 'maintenance',
      type: 'collapse',
      icon: icons.IconBug,
      children: [
        {
          id: 'error',
          title: 'error-404',
          type: 'item',
          url: '/pages/error',
          target: true
        },
        {
          id: '500',
          title: 'error-500',
          type: 'item',
          url: '/pages/500',
          target: true
        },
        {
          id: 'coming-soon',
          title: 'coming-soon',
          type: 'collapse',
          children: [
            {
              id: 'coming-soon1',
              title: 'coming-soon 01',
              type: 'item',
              url: '/pages/coming-soon1',
              target: true
            },
            {
              id: 'coming-soon2',
              title: 'coming-soon 02',
              type: 'item',
              url: '/pages/coming-soon2',
              target: true
            }
          ]
        },
        {
          id: 'under-construction',
          title: 'under-construction',
          type: 'item',
          url: '/pages/under-construction',
          target: true
        }
      ]
    }
  ]
};

export default pages;
