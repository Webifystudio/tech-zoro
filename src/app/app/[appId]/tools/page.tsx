"use client";

import { useState } from 'react';
import QRCode from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Upload, Star, Ticket, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ToolsPage() {
  const [qrValue, setQrValue] = useState('https://example.com');
  const { toast } = useToast();

  const handleDownloadQR = () => {
      const canvas = document.getElementById('qr-code-canvas') as HTMLCanvasElement;
      if (canvas) {
          const pngUrl = canvas
            .toDataURL('image/png')
            .replace('image/png', 'image/octet-stream');
          let downloadLink = document.createElement('a');
          downloadLink.href = pngUrl;
          downloadLink.download = 'qrcode.png';
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          toast({ title: "QR Code Downloaded!" });
      }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tools & Add-ons</h1>
        <p className="text-muted-foreground">Enhance your store with powerful tools.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2"><Ticket className="h-6 w-6" /><CardTitle>Discount Coupons</CardTitle></div>
            <CardDescription>Create and manage discount codes for your customers.</CardDescription>
          </CardHeader>
          <CardContent>
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Discount</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                 <TableBody>
                    <TableRow>
                        <TableCell>SUMMER20</TableCell>
                        <TableCell>20% OFF</TableCell>
                        <TableCell><Badge>Active</Badge></TableCell>
                    </TableRow>
                     <TableRow>
                        <TableCell>SALE50</TableCell>
                        <TableCell>50% OFF</TableCell>
                        <TableCell><Badge>Active</Badge></TableCell>
                    </TableRow>
                 </TableBody>
             </Table>
          </CardContent>
          <CardFooter>
            <Button>Create New Coupon</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2"><Star className="h-6 w-6" /><CardTitle>Testimonials / Reviews</CardTitle></div>
            <CardDescription>Manage customer feedback and display it on your store.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4 p-4 border rounded-lg">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400 mt-1" />
                <div>
                    <p className="font-semibold">"Amazing product! Highly recommended."</p>
                    <p className="text-sm text-muted-foreground">- Happy Customer</p>
                </div>
            </div>
            <div className="flex items-start gap-4 p-4 border rounded-lg">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400 mt-1" />
                <div>
                    <p className="font-semibold">"Great quality and fast shipping."</p>
                    <p className="text-sm text-muted-foreground">- Another Customer</p>
                </div>
            </div>
          </CardContent>
           <CardFooter>
            <Button variant="outline">Manage Reviews</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2"><QrCode className="h-6 w-6" /><CardTitle>QR Code Generator</CardTitle></div>
            <CardDescription>Generate a QR code that links to your store.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            <div className="p-4 bg-white rounded-lg">
                <QRCode id="qr-code-canvas" value={qrValue} size={160} level={"H"} />
            </div>
            <div className="w-full space-y-2">
                <Label htmlFor="qr-url">URL</Label>
                <Input id="qr-url" value={qrValue} onChange={(e) => setQrValue(e.target.value)} />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleDownloadQR}>Download QR Code</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2"><Upload className="h-6 w-6" /><CardTitle>Digital Product Upload</CardTitle></div>
            <CardDescription>Sell digital goods like PDFs and eBooks.</CardDescription>
          </CardHeader>
          <CardContent>
            <Card className="p-4 border-dashed">
                <div className="flex flex-col items-center justify-center space-y-2 text-center p-8 cursor-pointer aspect-square">
                    <div className="border-2 border-dashed border-muted-foreground/50 rounded-full p-4">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="font-semibold">Click to upload a file</p>
                    <p className="text-sm text-muted-foreground">PDF, EPUB, etc. up to 50MB</p>
                </div>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
