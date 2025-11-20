/**
 * NavLink Component
 * 
 * مكون رابط التنقل مع دعم الحالة النشطة
 */

import { Link, useLocation, type LinkProps } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface NavLinkProps extends LinkProps {
  activeClassName?: string;
  end?: boolean;
}

export function NavLink({
  to,
  children,
  className,
  activeClassName = 'bg-accent text-accent-foreground',
  end = false,
  ...props
}: NavLinkProps) {
  const location = useLocation();
  const toPath = typeof to === 'string' ? to : to.pathname || '';
  
  const isActive = end
    ? location.pathname === toPath
    : location.pathname.startsWith(toPath);

  return (
    <Link
      to={to}
      className={cn(
        className,
        isActive && activeClassName
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
