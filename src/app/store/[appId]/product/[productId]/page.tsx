
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { doc, getDoc, collection, addDoc, query, onSnapshot, serverTimestamp, orderBy, Timestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Star, Heart, ShoppingCart, Loader2, Trash2, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  userName: string;
  userAvatar: string | null;
  createdAt: Timestamp;
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
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isInCart, setIsInCart] = useState(false);

  const [newReviewRating, setNewReviewRating] = useState(0);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!appId || !productId || !db) return;
    
    const fetchProduct = async () => {
      setIsLoading(true);
      const productRef = doc(db, 'apps', appId, 'products', productId);
      const productSnap = await getDoc(productRef);
      if (productSnap.exists()) {
        setProduct({ id: productSnap.id, ...productSnap.data() } as Product);
      }
      setIsLoading(false);
    };

    const subscribeToReviews = () => {
      const reviewsQuery = query(collection(db, 'apps', appId, 'products', productId, 'reviews'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(reviewsQuery, (snapshot) => {
        setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
      });
      return unsubscribe;
    };

    fetchProduct();
    const unsubReviews = subscribeToReviews();

    return () => unsubReviews();
  }, [appId, productId]);

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

  if (isLoading) {
    return <div className="flex justify-center items-center h-[60vh]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  if (!product) {
    return <div className="text-center py-20">Product not found.</div>;
  }

  return (
    <div className="bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
                <div>
                <Card className="overflow-hidden shadow-lg">
                    <Image
                    src={product.imageUrl}
                    alt={product.name}
                    width={800}
                    height={800}
                    className="w-full object-cover aspect-square"
                    />
                </Card>
                </div>
                <div className="flex flex-col gap-4">
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">{product.name}</h1>
                <div className="flex items-center gap-2">
                    <StarRating rating={averageRating} />
                    <span className="text-muted-foreground text-sm">({reviews.length} reviews)</span>
                </div>
                <p className="text-3xl font-bold text-primary">${product.price.toFixed(2)}</p>
                <p className="text-muted-foreground leading-relaxed">{product.description}</p>
                <Separator />
                <div className="flex items-center gap-4 mt-4">
                    <div className="flex-1 flex flex-col sm:flex-row gap-4">
                        {isInCart ? (
                            <Button size="lg" variant="outline" className="w-full" onClick={() => {
                                setIsInCart(false);
                                toast({
                                    title: "Removed from Cart",
                                    description: `${product.name} has been removed from your cart.`
                                });
                            }}>
                                <Trash2 className="mr-2 h-5 w-5" /> Remove from Cart
                            </Button>
                        ) : (
                            <Button size="lg" className="w-full" onClick={() => {
                                setIsInCart(true);
                                toast({
                                    title: "Added to Cart",
                                    description: `${product.name} has been added to your cart.`
                                });
                            }}>
                                <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
                            </Button>
                        )}
                        <Button size="lg" className="w-full bg-primary/90 hover:bg-primary" onClick={() => {
                            toast({
                                title: "Proceeding to Checkout",
                                description: `Get ready to purchase ${product.name}!`
                            });
                        }}>
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
