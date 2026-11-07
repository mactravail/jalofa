import { CartProvider } from "@/components/cart/cart-context";
import { MainChrome } from "@/components/main-chrome";
import { SiteBottomNav } from "@/components/site-bottom-nav";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <MainChrome
        header={<SiteHeader />}
        footer={<SiteFooter />}
        bottomNav={<SiteBottomNav />}
      >
        {children}
      </MainChrome>
    </CartProvider>
  );
}
