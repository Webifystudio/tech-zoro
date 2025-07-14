
'use server';

/**
 * @fileOverview A flow for sending a welcome email to new users.
 *
 * - sendWelcomeEmail - Sends a welcome email.
 * - WelcomeEmailInput - The input type for the sendWelcomeEmail function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as nodemailer from 'nodemailer';
import 'dotenv/config';

const WelcomeEmailInputSchema = z.object({
  email: z.string().email().describe('The email address of the new user.'),
  username: z.string().describe('The username of the new user.'),
});

export type WelcomeEmailInput = z.infer<typeof WelcomeEmailInputSchema>;

export async function sendWelcomeEmail(input: WelcomeEmailInput): Promise<void> {
    await sendWelcomeEmailFlow(input);
}

const sendWelcomeEmailFlow = ai.defineFlow(
  {
    name: 'sendWelcomeEmailFlow',
    inputSchema: WelcomeEmailInputSchema,
    outputSchema: z.void(),
  },
  async ({ email, username }) => {
    
    // Ensure environment variables are set. This is crucial for Nodemailer to work.
    if (!process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
        throw new Error("Email server credentials are not configured in environment variables.");
    }
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });

    const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ZORO!</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
            }
            .container {
                max-width: 600px;
                margin: 40px auto;
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            }
            .header {
                background-color: #34D399;
                color: #ffffff;
                padding: 40px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-family: 'Brush Script MT', 'Cursive';
            }
            .content {
                padding: 40px;
                color: #333333;
                line-height: 1.6;
            }
            .content h2 {
                color: #111827;
                font-size: 22px;
            }
            .content p {
                font-size: 16px;
                margin-bottom: 20px;
            }
            .button {
                display: inline-block;
                padding: 12px 24px;
                background-color: #34D399;
                color: #ffffff;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
            }
            .footer {
                background-color: #f8f9fa;
                padding: 20px;
                text-align: center;
                font-size: 12px;
                color: #6c757d;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to ZORO!</h1>
            </div>
            <div class="content">
                <h2>Hi ${username},</h2>
                <p>We are thrilled to have you on board. ZORO is the perfect platform to build and manage your online business with ease.</p>
                <p>You're all set to start creating your first app and storefront. Here are a few things you can do to get started:</p>
                <ul>
                    <li>Create your first app from the dashboard.</li>
                    <li>Customize your storefront's look and feel.</li>
                    <li>Add your products and set up categories.</li>
                </ul>
                <p>If you have any questions, don't hesitate to reach out to our support team.</p>
                <p>
                    <a href="https://tech-zoro.web.app/login" class="button">Go to Dashboard</a>
                </p>
                <p>Happy Selling!<br>The ZORO Team</p>
            </div>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} ZORO Inc. All rights reserved.</p>
                <p>You received this email because you signed up for an account on ZORO.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    const mailOptions = {
      from: `"ZORO" <${process.env.EMAIL_SERVER_USER}>`,
      to: email,
      subject: `Welcome to ZORO, ${username}!`,
      html: emailHtml,
    };

    await transporter.sendMail(mailOptions);
  }
);
