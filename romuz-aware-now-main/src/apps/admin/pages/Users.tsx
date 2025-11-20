import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { toast } from 'sonner';
import { Users as UsersIcon, Edit2, Loader2 } from 'lucide-react';
import { fetchUsersWithTenant, updateUserTenant, fetchAllTenants } from '@/core/tenancy/integration';
import type { UserWithTenant } from '@/core/tenancy/integration';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<UserWithTenant | null>(null);
  const [newTenantId, setNewTenantId] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users-with-tenant'],
    queryFn: fetchUsersWithTenant,
  });

  const { data: tenants } = useQuery({
    queryKey: ['tenants-list'],
    queryFn: fetchAllTenants,
  });

  const updateMutation = useMutation({
    mutationFn: ({ userId, tenantId }: { userId: string; tenantId: string }) =>
      updateUserTenant(userId, tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-tenant'] });
      toast.success('User link updated successfully');
      setIsDialogOpen(false);
      setSelectedUser(null);
      setNewTenantId('');
    },
    onError: (error: any) => {
      console.error('Error updating user tenant:', error);
      const message = error?.message || 'Failed to update link';
      toast.error(message);
    },
  });

  const handleEditClick = (user: UserWithTenant) => {
    setSelectedUser(user);
    setNewTenantId(user.tenant_id || '');
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!selectedUser || !newTenantId) return;
    updateMutation.mutate({ userId: selectedUser.user_id, tenantId: newTenantId });
  };

  if (usersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <UsersIcon className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">View and edit user-tenant associations</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User List</CardTitle>
          <CardDescription>
            All registered users in the system with their linked tenant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Linked Tenant</TableHead>
                <TableHead>Registration Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    {user.tenant_name ? (
                      <Badge variant="secondary">{user.tenant_name}</Badge>
                    ) : (
                      <Badge variant="outline">Unlinked</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.user_created_at).toLocaleDateString('en-US')}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditClick(user)}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit Link
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!users || users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User-Tenant Link</DialogTitle>
            <DialogDescription>
              Select the tenant you want to link this user to
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <p className="text-sm text-muted-foreground">{selectedUser?.email}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Select New Tenant</label>
              <Select value={newTenantId} onValueChange={setNewTenantId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tenant..." />
                </SelectTrigger>
                <SelectContent>
                  {tenants?.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!newTenantId || updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
