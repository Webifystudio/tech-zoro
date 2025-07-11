
"use client";

import { useState } from 'react';
import QRCode from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function QrCodePage() {
  const [qrValue, setQrValue] = useState('https://example.com');
  const { toast } = useToast();

  const handleDownloadQR = () => {
    const canvas = document.getElementById('qr-code-canvas') as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
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
            <h1 className="text-3xl font-bold tracking-tight">QR Code Generator</h1>
            <p className="text-muted-foreground">Generate a QR code that links to your store or any URL.</p>
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2"><QrCode className="h-6 w-6" /><CardTitle>Generator</CardTitle></div>
            <CardDescription>Enter a URL to generate a downloadable QR code.</CardDescription>
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
    </div>
  );
}
