
'use server';

/**
 * @fileOverview A flow for sending a team invitation email.
 *
 * - sendTeamInvitation - Sends an invitation email to a new team member.
 * - TeamInvitationInput - The input type for the sendTeamInvitation function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as nodemailer from 'nodemailer';
import 'dotenv/config';

const TeamInvitationInputSchema = z.object({
  recipientEmail: z.string().email().describe('The email address of the person being invited.'),
  inviterName: z.string().describe('The name of the person sending the invitation.'),
  appName: z.string().describe('The name of the app they are being invited to.'),
  invitationLink: z.string().url().describe('The unique link to accept the invitation.'),
});

export type TeamInvitationInput = z.infer<typeof TeamInvitationInputSchema>;

export async function sendTeamInvitation(input: TeamInvitationInput): Promise<void> {
    await sendTeamInvitationFlow(input);
}

const sendTeamInvitationFlow = ai.defineFlow(
  {
    name: 'sendTeamInvitationFlow',
    inputSchema: TeamInvitationInputSchema,
    outputSchema: z.void(),
  },
  async ({ recipientEmail, inviterName, appName, invitationLink }) => {
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
        <title>You're Invited to Collaborate!</title>
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
                <h1>You're Invited!</h1>
            </div>
            <div class="content">
                <h2>Hello,</h2>
                <p><strong>${inviterName}</strong> has invited you to collaborate on the app <strong>"${appName}"</strong> on ZORO.</p>
                <p>Click the button below to accept the invitation. If you don't have a ZORO account, you'll be prompted to create one first.</p>
                <p>
                    <a href="${invitationLink}" class="button">Accept Invitation</a>
                </p>
                <p>Welcome to the team!<br>The ZORO Team</p>
            </div>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} ZORO Inc. All rights reserved.</p>
                 <p>If you were not expecting this invitation, you can ignore this email.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    const mailOptions = {
      from: `"ZORO" <${process.env.EMAIL_SERVER_USER}>`,
      to: recipientEmail,
      subject: `You've been invited to collaborate on ${appName}`,
      html: emailHtml,
    };

    await transporter.sendMail(mailOptions);
  }
);
