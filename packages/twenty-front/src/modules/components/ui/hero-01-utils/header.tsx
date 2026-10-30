import { useState } from 'react';
import { ArrowUpRight, Menu } from 'lucide-react';
import { Trans } from '@lingui/react';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export type NavigationSection = {
  title: string;
  href: string;
  isActive?: boolean;
};
export const Brand = () => (
  <a href="/landing" className="bs-brand" aria-label="BlackSync Cloud home">
    <img
      src="/images/integrations/blacksync-pulse-logo.svg"
      width="36"
      height="36"
      alt=""
    />
    <span>
      BlackSync<span className="bs-brand-cloud">Cloud</span>
    </span>
  </a>
);

export default function Header({
  navigationData,
}: {
  navigationData: NavigationSection[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <header className="bs-header">
      <div className="bs-shell bs-header-inner">
        <Brand />
        <NavigationMenu className="hidden lg:flex" aria-label="Main navigation">
          <NavigationMenuList>
            {navigationData.map((item) => (
              <NavigationMenuItem key={item.title}>
                <NavigationMenuLink
                  href={item.href}
                  className={`bs-nav-link ${item.isActive ? 'bs-nav-active' : ''}`}
                >
                  <Trans id={item.title} />
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
        <div className="hidden items-center gap-6 lg:flex">
          <a href="/welcome" className="bs-login">
            <Trans id="Log in" />
          </a>
          <Button asChild className="bs-button bs-button-small">
            <a href="/welcome">
              <Trans id="Get started" />
              <ArrowUpRight size={15} />
            </a>
          </Button>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="lg:hidden"
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>BlackSync Cloud</SheetTitle>
              <SheetDescription>
                <Trans id="Your relationships. Your next move." />
              </SheetDescription>
            </SheetHeader>
            <nav
              className="mt-10 flex flex-col gap-6"
              aria-label="Mobile navigation"
            >
              {navigationData.map((item) => (
                <SheetClose asChild key={item.title}>
                  <a href={item.href} className="text-lg text-foreground">
                    <Trans id={item.title} />
                  </a>
                </SheetClose>
              ))}
              <SheetClose asChild>
                <Button asChild className="mt-4">
                  <a href="/welcome">
                    <Trans id="Get started" />
                    <ArrowUpRight size={16} />
                  </a>
                </Button>
              </SheetClose>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
