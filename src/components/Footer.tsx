import Link from 'next/link';
import { Button } from './ui/button';
import { Input } from './ui/input';

export function Footer() {
  return (
    <footer className="w-full bg-muted text-muted-foreground mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
             <h2 className="text-xl font-bold text-foreground mb-2" style={{fontFamily: "'Brush Script MT', 'Cursive'"}}>ZORO</h2>
            <p className="text-sm">Your one-stop shop for everything amazing.</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Shop</h3>
            <ul className="space-y-1 text-sm">
              <li><Link href="#" className="hover:text-primary">New Arrivals</Link></li>
              <li><Link href="#" className="hover:text-primary">Best Sellers</Link></li>
              <li><Link href="#" className="hover:text-primary">All Products</Link></li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Support</h3>
            <ul className="space-y-1 text-sm">
              <li><Link href="#" className="hover:text-primary">Contact Us</Link></li>
              <li><Link href="#" className="hover:text-primary">FAQ</Link></li>
              <li><Link href="#" className="hover:text-primary">Shipping & Returns</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Stay Connected</h3>
            <p className="text-sm mt-2 mb-3">Subscribe to our newsletter for the latest updates and offers.</p>
            <form className="flex gap-2">
                <Input type="email" placeholder="Enter your email" className="bg-background"/>
                <Button type="submit">Subscribe</Button>
            </form>
          </div>
        </div>
        <div className="mt-12 border-t pt-6 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Zoro Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
