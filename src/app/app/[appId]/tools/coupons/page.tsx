
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { collection, addDoc, query, onSnapshot, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Loader2, PlusCircle, Calendar as CalendarIcon, Ticket } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Coupon {
    id: string;
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    status: 'Active' | 'Inactive';
    createdAt: Timestamp;
    expiresAt?: Timestamp;
    usageLimit?: number;
    uses?: number;
}

export default function CouponsPage() {
  const { toast } = useToast();
  const params = useParams();
  const appId = params.appId as string;
  const [user, setUser] = useState<User | null>(null);

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(true);
  const [isCouponDialogOpen, setIsCouponDialogOpen] = useState(false);
  const [isCreatingCoupon, setIsCreatingCoupon] = useState(false);

  const [couponCode, setCouponCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [expiresAt, setExpiresAt] = useState<Date | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return () => unsubscribe();
  }, []);
  
  const resetCouponForm = () => {
    setCouponCode('');
    setDiscountValue('');
    setDiscountType('percentage');
    setUsageLimit('');
    setExpiresAt(undefined);
  }

  useEffect(() => {
    if (user && db && appId) {
      const q = query(collection(db, "apps", appId, "coupons"), orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setCoupons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Coupon)));
        setIsLoadingCoupons(false);
      }, (error) => {
        console.error("Error fetching coupons: ", error);
        toast({ variant: 'destructive', title: "Error", description: "Could not fetch coupons." });
        setIsLoadingCoupons(false);
      });
      return () => unsubscribe();
    } else {
      setIsLoadingCoupons(false);
    }
  }, [user, appId, toast]);

  const handleCreateCoupon = async (e: FormEvent) => {
    e.preventDefault();
    if (!couponCode || !discountValue || !db) return;
    setIsCreatingCoupon(true);
    try {
        const newCoupon: { [key: string]: any } = {
            code: couponCode.toUpperCase(),
            discountType: discountType,
            discountValue: parseFloat(discountValue),
            status: 'Active',
            createdAt: serverTimestamp(),
            uses: 0,
        };

        if (usageLimit) {
            newCoupon.usageLimit = parseInt(usageLimit, 10);
        }
        if (expiresAt) {
            newCoupon.expiresAt = Timestamp.fromDate(expiresAt);
        }

        await addDoc(collection(db, "apps", appId, "coupons"), newCoupon);
        
        toast({ title: 'Coupon Created', description: `Coupon "${couponCode}" has been added.` });
        setIsCouponDialogOpen(false);
        resetCouponForm();
    } catch(error: any) {
        toast({ variant: 'destructive', title: 'Failed to create coupon', description: error.message });
    } finally {
        setIsCreatingCoupon(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Discount Coupons</h1>
            <p className="text-muted-foreground">Create and manage discount codes for your customers to boost sales.</p>
        </div>
        <Dialog open={isCouponDialogOpen} onOpenChange={(open) => { setIsCouponDialogOpen(open); if(!open) resetCouponForm(); }}>
            <DialogTrigger asChild>
                <Button><PlusCircle className="mr-2 h-4 w-4" />Create New Coupon</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Coupon</DialogTitle>
                    <DialogDescription>Fill in the details for your new discount coupon.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateCoupon}>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="couponCode">Coupon Code</Label>
                            <Input id="couponCode" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} required />
                        </div>
                            <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="discountType">Discount Type</Label>
                                <Select value={discountType} onValueChange={(v) => setDiscountType(v as any)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="discountValue">Value</Label>
                                <Input id="discountValue" type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)} required />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="usageLimit">Usage Limit (optional)</Label>
                                <Input id="usageLimit" type="number" placeholder="e.g., 100" value={usageLimit} onChange={e => setUsageLimit(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="expiresAt">Expires At (optional)</Label>
                                    <Popover>
                                    <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !expiresAt && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {expiresAt ? format(expiresAt, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={expiresAt}
                                        onSelect={setExpiresAt}
                                        initialFocus
                                    />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                        <Button type="submit" disabled={isCreatingCoupon}>
                            {isCreatingCoupon && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Coupon
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      </div>

       <Card>
          <CardHeader>
            <div className="flex items-center gap-2"><Ticket className="h-6 w-6" /><CardTitle>All Coupons</CardTitle></div>
            <CardDescription>A list of all active and inactive coupons.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingCoupons ? (
                <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : coupons.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Discount</TableHead>
                            <TableHead>Usage</TableHead>
                            <TableHead>Expires</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {coupons.map(coupon => (
                            <TableRow key={coupon.id}>
                                <TableCell className="font-medium">{coupon.code}</TableCell>
                                <TableCell>{coupon.discountValue}{coupon.discountType === 'percentage' ? '%' : ' (fixed)'} OFF</TableCell>
                                <TableCell>{coupon.uses || 0} / {coupon.usageLimit || '∞'}</TableCell>
                                <TableCell>{coupon.expiresAt ? format(coupon.expiresAt.toDate(), 'PPP') : 'Never'}</TableCell>
                                <TableCell><Badge variant={coupon.status === 'Active' ? 'default' : 'secondary'}>{coupon.status}</Badge></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <p className="text-center text-muted-foreground py-8">No coupons created yet.</p>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
