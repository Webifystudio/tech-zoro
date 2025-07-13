
"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Code, KeyRound, Palette, ShoppingBag } from 'lucide-react';

const documentationSections = [
    {
        id: 'api-setup',
        title: 'API & Initial Setup',
        icon: KeyRound,
        content: (
            <div className="prose prose-sm dark:prose-invert max-w-none">
                <p>To connect your application with Firebase services, you need to obtain your project's configuration keys. Follow these steps:</p>
                <ol>
                    <li>Go to the <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer">Firebase Console</a> and select your project.</li>
                    <li>Click the gear icon next to "Project Overview" and select <strong>Project settings</strong>.</li>
                    <li>In the "Your apps" card, select the web app for which you need the config object.</li>
                    <li>Under "Firebase SDK snippet", select the <strong>Config</strong> option.</li>
                    <li>The configuration object will be displayed. You will need the following keys: <code>apiKey</code>, <code>authDomain</code>, <code>projectId</code>, and <code>storageBucket</code>.</li>
                    <li>Copy these values and paste them into the corresponding fields when creating or setting up your app in ZORO.</li>
                </ol>
                <p>These keys allow your ZORO application to securely communicate with your Firebase backend for authentication, data storage, and more.</p>
            </div>
        )
    },
    {
        id: 'customization',
        title: 'Store Customization',
        icon: Palette,
        content: (
             <div className="prose prose-sm dark:prose-invert max-w-none">
                <p>Personalize the look and feel of your storefront to match your brand identity.</p>
                <ul>
                    <li><strong>Branding:</strong> Upload your store's logo and a cover image. The logo will appear in the header, and the cover image will be the main banner on your homepage.</li>
                    <li><strong>Themes:</strong> Choose from a variety of pre-built themes, including Light, Dark, Gradient, and Glass effects, to instantly change your store's appearance.</li>
                    <li><strong>Primary Color:</strong> Select a primary color that will be used for buttons, links, and other interactive elements.</li>
                    <li><strong>Font Family:</strong> Choose a font that best represents your brand's style.</li>
                </ul>
            </div>
        )
    },
    {
        id: 'product-management',
        title: 'Product Management',
        icon: ShoppingBag,
        content: (
            <div className="prose prose-sm dark:prose-invert max-w-none">
                <p>Manage your product inventory from the "Products" page.</p>
                <ul>
                    <li><strong>Adding a Product:</strong> Click "Add Product" and fill in the details: name, description, price, quantity (leave blank for infinite), and an image.</li>
                    <li><strong>Sell Platform:</strong> Choose how customers will purchase the product.
                        <ul>
                            <li><strong>WhatsApp:</strong> Redirects customers to a WhatsApp chat with a pre-filled message.</li>
                            <li><strong>Instagram:</strong> Links to a specific Instagram post URL.</li>
                            <li><strong>Affiliate:</strong> Redirects to an external affiliate link.</li>
                        </ul>
                    </li>
                    <li><strong>Categories:</strong> Assign products to categories to help customers navigate your store. You can manage categories on the "Categories" page.</li>
                </ul>
            </div>
        )
    }
];


const legalSections = [
    {
        id: 'privacy-policy',
        title: 'Privacy Policy',
        content: `
            <h3 class="font-semibold">1. Information We Collect</h3>
            <p>We collect information you provide directly to us, such as when you create an account, create an app, or otherwise communicate with us. This information may include your name, email address, and any other information you choose to provide.</p>
            <h3 class="font-semibold mt-4">2. Use of Information</h3>
            <p>We use the information we collect to operate, maintain, and provide you with the features and functionality of the Service, as well as to communicate directly with you, such as to send you email messages.</p>
            <h3 class="font-semibold mt-4">3. Sharing of Information</h3>
            <p>We will not rent or sell your information to third parties outside ZORO without your consent.</p>
        `
    },
    {
        id: 'terms-and-conditions',
        title: 'Terms and Conditions',
        content: `
            <p>By accessing or using the Service you agree to be bound by these Terms. If you disagree with any part of the terms then you may not access the Service.</p>
            <h3 class="font-semibold mt-4">Accounts</h3>
            <p>When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.</p>
            <h3 class="font-semibold mt-4">Termination</h3>
            <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
        `
    }
]

export default function DocsPage() {
    return (
        <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Documentation</h1>
                <p className="mt-4 text-lg text-muted-foreground">Everything you need to get started and build your app with ZORO.</p>
            </div>

            <div className="space-y-12">
                <Card>
                    <CardHeader>
                        <CardTitle>Guides & Tutorials</CardTitle>
                        <CardDescription>Step-by-step guides to help you set up and manage your application.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Accordion type="single" collapsible className="w-full">
                            {documentationSections.map(section => (
                                <AccordionItem key={section.id} value={section.id}>
                                    <AccordionTrigger>
                                        <div className="flex items-center gap-3">
                                            <section.icon className="h-5 w-5 text-primary"/>
                                            <span className="font-semibold">{section.title}</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        {section.content}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Legal</CardTitle>
                        <CardDescription>Our policies and terms of service.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Accordion type="single" collapsible className="w-full">
                            {legalSections.map(section => (
                                <AccordionItem key={section.id} value={section.id}>
                                    <AccordionTrigger>
                                        <span className="font-semibold">{section.title}</span>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: section.content }}/>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
