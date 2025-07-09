"use client";

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const mockTeam = [
  { id: 1, name: 'You', email: 'owner@example.com', role: 'Owner', avatar: 'https://github.com/shadcn.png' },
  { id: 2, name: 'Jane Doe', email: 'jane@example.com', role: 'Admin', avatar: '' },
  { id: 3, name: 'John Smith', email: 'john@example.com', role: 'Staff', avatar: '' },
];

export default function TeamPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team & Access</h1>
        <p className="text-muted-foreground">Manage your team members and their roles.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invite New Member</CardTitle>
          <CardDescription>Enter the email and select a role for your new team member.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input type="email" id="email" placeholder="member@example.com" />
            </div>
            <div className="w-full sm:w-48 space-y-2">
                <Label htmlFor="role">Role</Label>
                 <Select>
                    <SelectTrigger id="role">
                        <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="flex items-end">
                <Button>Send Invite</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage Team</CardTitle>
          <CardDescription>A list of all team members in your store.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {mockTeam.map(member => (
                        <TableRow key={member.id}>
                            <TableCell>
                                <div className="flex items-center gap-4">
                                    <Avatar>
                                        <AvatarImage src={member.avatar} />
                                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{member.name}</p>
                                        <p className="text-sm text-muted-foreground">{member.email}</p>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant={member.role === 'Owner' ? 'default' : 'secondary'}>{member.role}</Badge>
                            </TableCell>
                             <TableCell className="text-right">
                                {member.role !== 'Owner' && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                        <DropdownMenuItem>Change Role</DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Remove
                                        </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>

    </div>
  );
}
