
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { doc, getDoc, collection, addDoc, query, onSnapshot, serverTimestamp, orderBy, Timestamp, where, getDocs, updateDoc, increment } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Star, Heart, ShoppingCart, Loader2, Trash2, Zap } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCart } from '@/context/CartProvider';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  quantity: number | null;
  platform: 'instagram' | 'whatsapp' | 'affiliate';
  instagramPostUrl?: string;
  affiliateUrl?: string;
}

interface AppIntegrations {
    whatsappNumber?: string;
    instagramProfileUrl?: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  userName: string;
  userAvatar: string | null;
  createdAt: Timestamp;
}

interface Coupon {
    id: string;
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    expiresAt?: Timestamp;
    usageLimit?: number;
    uses?: number;
}


const StarRating = ({ rating, size = 'h-5 w-5' }: { rating: number; size?: string }) => (
  <div className="flex items-center">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={cn(size, i < Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/50')}
      />
    ))}
  </div>
);

export default function ProductDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const appId = params.appId as string;
  const productId = params.productId as string;

  const [user, setUser] = useState<User | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [appIntegrations, setAppIntegrations] = useState<AppIntegrations | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWishlisted, setIsWishlisted] = useState(false);
  
  const { cartItems, addToCart, removeFromCart } = useCart();
  const isInCart = product ? cartItems.some(item => item.id === product.id) : false;

  const [newReviewRating, setNewReviewRating] = useState(0);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [finalPrice, setFinalPrice] = useState<number | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  
  const [isRedirectDialogOpen, setIsRedirectDialogOpen] = useState(false);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (product) {
      setFinalPrice(product.price);
      removeCoupon();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  useEffect(() => {
    if (!appId || !productId || !db) return;
    
    const fetchProductAndApp = async () => {
      setIsLoading(true);
      const productRef = doc(db, 'apps', appId, 'products', productId);
      const appRef = doc(db, 'apps', appId);
      
      try {
        const productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
          const productData = { id: productSnap.id, ...productSnap.data() } as Product;
          setProduct(productData);
          setFinalPrice(productData.price);
        }

        const appSnap = await getDoc(appRef);
        if (appSnap.exists()) {
          setAppIntegrations(appSnap.data().integrations || {});
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load product details.' });
      } finally {
        setIsLoading(false);
      }
    };

    const subscribeToReviews = () => {
      const reviewsQuery = query(collection(db, 'apps', appId, 'products', productId, 'reviews'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(reviewsQuery, (snapshot) => {
        setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
      });
      return unsubscribe;
    };

    fetchProductAndApp();
    const unsubReviews = subscribeToReviews();

    return () => unsubReviews();
  }, [appId, productId, toast]);
  
  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !product) return;
    setIsApplyingCoupon(true);
    setCouponError(null);

    try {
        const couponsRef = collection(db, 'apps', appId, 'coupons');
        const q = query(couponsRef, where('code', '==', couponCode.trim().toUpperCase()));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            setCouponError('Invalid coupon code.');
            return;
        }

        const couponDoc = querySnapshot.docs[0];
        const couponData = { id: couponDoc.id, ...couponDoc.data() } as Coupon;

        if (couponData.expiresAt && isPast(couponData.expiresAt.toDate())) {
            setCouponError('This coupon has expired.');
            return;
        }

        if (couponData.usageLimit && (couponData.uses || 0) >= couponData.usageLimit) {
            setCouponError('This coupon has reached its usage limit.');
            return;
        }

        let newPrice = product.price;
        if (couponData.discountType === 'fixed') {
            newPrice -= couponData.discountValue;
        } else { // percentage
            newPrice -= product.price * (couponData.discountValue / 100);
        }
        
        setFinalPrice(Math.max(0, newPrice));
        setAppliedCoupon(couponData);
        toast({ title: "Coupon Applied Successfully!" });

    } catch (error) {
        setCouponError('Could not apply coupon.');
    } finally {
        setIsApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
    if(product) setFinalPrice(product.price);
  }

  const averageRating = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;

  const handleReviewSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ variant: 'destructive', title: 'You must be logged in to leave a review.' });
      return;
    }
    if (newReviewRating === 0 || !newReviewComment.trim()) {
      toast({ variant: 'destructive', title: 'Please provide a rating and a comment.' });
      return;
    }
    setIsSubmittingReview(true);
    try {
      await addDoc(collection(db, 'apps', appId, 'products', productId, 'reviews'), {
        rating: newReviewRating,
        comment: newReviewComment,
        userName: user.displayName || 'Anonymous',
        userAvatar: user.photoURL,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      toast({ title: 'Review submitted!', description: 'Thank you for your feedback.' });
      setNewReviewRating(0);
      setNewReviewComment('');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to submit review', description: error.message });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product || !db) return;

    if (appliedCoupon) {
      const couponRef = doc(db, 'apps', appId, 'coupons', appliedCoupon.id);
      try {
        await updateDoc(couponRef, {
          uses: increment(1)
        });
      } catch (error) {
        console.error("Failed to update coupon usage:", error);
      }
    }

    let url = '';
    if (product.platform === 'whatsapp' && appIntegrations?.whatsappNumber) {
        const message = encodeURIComponent(`I want to buy this ${product.name} (Product ID: ${product.id})`);
        url = `https://wa.me/${appIntegrations.whatsappNumber}?text=${message}`;
    } else if (product.platform === 'instagram' && product.instagramPostUrl) {
        url = product.instagramPostUrl;
    } else if (product.platform === 'affiliate' && product.affiliateUrl) {
        url = product.affiliateUrl;
    }
    
    if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
    } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not determine the redirect URL.' });
    }
    setIsRedirectDialogOpen(false);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-[60vh]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  if (!product) {
    return <div className="text-center py-20">Product not found.</div>;
  }

  const isOutOfStock = product.quantity !== null && product.quantity <= 0;

  return (
    <div className="bg-background">
        <Dialog open={isRedirectDialogOpen} onOpenChange={setIsRedirectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Redirection</DialogTitle>
              <DialogDescription className="py-4 text-base text-foreground/80 leading-relaxed">
                Please read this and confirm for redirection automated by Zoro.
                This platform does not contain any payment option like Amazon, Flipkart, etc., to avoid scams.
                By continuing, you will be redirected to the seller's page where you can message them, send a screenshot of the product, and complete your deal.
                <br/><br/>
                Thanks for using our services!
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
               <Button type="button" variant="outline" onClick={() => setIsRedirectDialogOpen(false)}>Cancel</Button>
               <Button type="button" onClick={handleBuyNow}>Confirm & Redirect</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
                <div>
                  <Card className="overflow-hidden shadow-lg relative">
                      <Image
                          src={product.imageUrl}
                          alt={product.name}
                          width={800}
                          height={800}
                          className="w-full object-cover aspect-square"
                      />
                      {isOutOfStock && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <span className="text-white font-bold text-2xl border-2 border-white rounded-md p-4">Out of Stock</span>
                          </div>
                      )}
                  </Card>
                </div>
                <div className="flex flex-col gap-4">
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">{product.name}</h1>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <StarRating rating={averageRating} />
                        <span className="text-muted-foreground text-sm">({reviews.length} reviews)</span>
                    </div>
                    <Separator orientation="vertical" className="h-6"/>
                    <span className="text-sm font-medium text-primary">
                        {product.quantity === null ? "In Stock" : `${product.quantity} units available`}
                    </span>
                </div>
                <div>
                    {appliedCoupon && finalPrice !== null ? (
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-bold text-primary">₹{finalPrice.toFixed(2)}</p>
                            <p className="text-xl font-medium text-muted-foreground line-through">₹{product.price.toFixed(2)}</p>
                        </div>
                    ) : (
                        <p className="text-3xl font-bold text-primary">₹{finalPrice?.toFixed(2) || product.price.toFixed(2)}</p>
                    )}
                </div>
                <p className="text-muted-foreground leading-relaxed">{product.description}</p>
                <Separator />
                 <div className="space-y-4">
                    <Label htmlFor="coupon">Have a coupon?</Label>
                    {appliedCoupon ? (
                        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <p className="text-sm font-medium text-green-700 dark:text-green-300">
                                Coupon <span className="font-bold">{appliedCoupon.code}</span> applied!
                            </p>
                            <Button variant="ghost" size="sm" onClick={() => {removeCoupon(); toast({ title: 'Coupon removed.' })}}>Remove</Button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <Input 
                                id="coupon" 
                                placeholder="Enter coupon code" 
                                className="flex-1"
                                value={couponCode}
                                onChange={(e) => { setCouponCode(e.target.value); setCouponError(null); }}
                                disabled={isApplyingCoupon || isOutOfStock}
                            />
                            <Button onClick={handleApplyCoupon} disabled={isApplyingCoupon || !couponCode || isOutOfStock}>
                                {isApplyingCoupon && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Apply
                            </Button>
                        </div>
                    )}
                    {couponError && <p className="text-sm text-destructive">{couponError}</p>}
                </div>
                <Separator />
                <div className="flex items-center gap-4 mt-2">
                    <div className="flex-1 flex flex-col sm:flex-row gap-4">
                        {isInCart ? (
                            <Button size="lg" variant="outline" className="w-full" onClick={() => removeFromCart(product.id)} disabled={isOutOfStock}>
                                <Trash2 className="mr-2 h-5 w-5" /> Remove from Cart
                            </Button>
                        ) : (
                            <Button size="lg" className="w-full" onClick={() => addToCart(product)} disabled={isOutOfStock}>
                                <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
                            </Button>
                        )}
                        <Button size="lg" className="w-full bg-primary/90 hover:bg-primary" onClick={() => setIsRedirectDialogOpen(true)} disabled={isOutOfStock}>
                            <Zap className="mr-2 h-5 w-5" /> Buy Now
                        </Button>
                    </div>
                    <Button
                        size="icon"
                        variant="outline"
                        className="h-12 w-12"
                        onClick={() => {
                            const newWishlistedState = !isWishlisted;
                            setIsWishlisted(newWishlistedState);
                            toast({ title: newWishlistedState ? 'Added to wishlist!' : 'Removed from wishlist.' });
                        }}
                        aria-label="Add to wishlist"
                    >
                        <Heart className={cn('h-5 w-5', isWishlisted ? 'text-red-500 fill-red-500' : 'text-muted-foreground')} />
                    </Button>
                </div>
                </div>
            </div>
        </div>

        <div className="bg-muted/40 py-12 mt-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-3 gap-8 lg:gap-16">
                    <div className="md:col-span-2">
                        <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
                        <div className="space-y-8">
                            {reviews.length > 0 ? (
                            reviews.map(review => (
                                <div key={review.id} className="flex gap-4">
                                <Avatar>
                                    <AvatarImage src={review.userAvatar || ''} />
                                    <AvatarFallback>{review.userName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                    <p className="font-semibold">{review.userName}</p>
                                    <span className="text-sm text-muted-foreground">{review.createdAt ? format(review.createdAt.toDate(), 'PPP') : ''}</span>
                                    </div>
                                    <StarRating rating={review.rating} size="h-4 w-4" />
                                    <p className="mt-2 text-foreground/80">{review.comment}</p>
                                </div>
                                </div>
                            ))
                            ) : (
                            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                                <p className="text-muted-foreground">No reviews yet.</p>
                                <p className="text-sm text-muted-foreground mt-1">Be the first to review this product!</p>
                            </div>
                            )}
                        </div>
                    </div>
                    <div>
                    <Card className="sticky top-24">
                        <CardHeader>
                        <CardTitle>Write a Review</CardTitle>
                        </CardHeader>
                        <CardContent>
                        <form onSubmit={handleReviewSubmit} className="space-y-4">
                            <div>
                            <Label className="mb-2 block">Your Rating</Label>
                            <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                <button type="button" key={i} onClick={() => setNewReviewRating(i + 1)}>
                                    <Star className={cn('h-6 w-6 cursor-pointer transition-colors', i < newReviewRating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30 hover:text-yellow-400/80')} />
                                </button>
                                ))}
                            </div>
                            </div>
                            <div className="space-y-2">
                            <Label htmlFor="review-comment">Your Review</Label>
                            <Textarea
                                id="review-comment"
                                placeholder="What did you like or dislike?"
                                value={newReviewComment}
                                onChange={(e) => setNewReviewComment(e.target.value)}
                                rows={4}
                            />
                            </div>
                            <Button type="submit" className="w-full" disabled={isSubmittingReview}>
                            {isSubmittingReview && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Review
                            </Button>
                        </form>
                        </CardContent>
                    </Card>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}
