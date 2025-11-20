import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
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
import { Skeleton } from '@/core/components/ui/skeleton';
import { toast } from 'sonner';
import { Shield, Users, Plus, Trash2, Loader2, UserCog } from 'lucide-react';
import {
  getUsersWithRoles,
  assignRole,
  removeRole,
  type UserWithRoles,
  type AppRole,
} from '@/core/rbac';

const AVAILABLE_ROLES: { value: AppRole; label: string; description: string }[] = [
  { value: 'employee', label: 'Employee', description: 'Basic user access' },
  { value: 'awareness_manager', label: 'Awareness Manager', description: 'Manage awareness campaigns' },
  { value: 'risk_manager', label: 'Risk Manager', description: 'Manage risk assessments' },
  { value: 'compliance_officer', label: 'Compliance Officer', description: 'Manage compliance' },
  { value: 'hr_manager', label: 'HR Manager', description: 'Manage HR functions' },
  { value: 'it_manager', label: 'IT Manager', description: 'Manage IT infrastructure' },
  { value: 'executive', label: 'Executive', description: 'Executive dashboard access' },
  { value: 'tenant_admin', label: 'Tenant Admin', description: 'Full tenant administration' },
];

interface RoleManagementDialogProps {
  user: UserWithRoles | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function RoleManagementDialog({ user, isOpen, onClose, onSuccess }: RoleManagementDialogProps) {
  const { t } = useTranslation();
  const [selectedRole, setSelectedRole] = useState<AppRole | ''>('');
  const queryClient = useQueryClient();

  const assignMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: AppRole }) =>
      assignRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast.success(t('roleManagement.roleAssigned'));
      setSelectedRole('');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error?.message || t('roleManagement.errors.assignFailed'));
    },
  });

  const removeMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: AppRole }) =>
      removeRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast.success(t('roleManagement.roleRemoved'));
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error?.message || t('roleManagement.errors.removeFailed'));
    },
  });

  const handleAssignRole = () => {
    if (!user || !selectedRole) return;
    assignMutation.mutate({ userId: user.user_id, role: selectedRole });
  };

  const handleRemoveRole = (role: string) => {
    if (!user) return;
    removeMutation.mutate({ userId: user.user_id, role: role as AppRole });
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            {t('roleManagement.manageRoles')}
          </DialogTitle>
          <DialogDescription>
            {t('roleManagement.manageRolesFor')}: <strong>{user.email}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Roles */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('roleManagement.currentRoles')}</label>
            <div className="flex flex-wrap gap-2">
              {user.roles.length > 0 ? (
                user.roles.map((role) => (
                  <Badge key={role} variant="secondary" className="gap-2">
                    {AVAILABLE_ROLES.find((r) => r.value === role)?.label || role}
                    <button
                      onClick={() => handleRemoveRole(role)}
                      disabled={removeMutation.isPending}
                      className="hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">{t('roleManagement.noRoles')}</p>
              )}
            </div>
          </div>

          {/* Assign New Role */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('roleManagement.assignNewRole')}</label>
            <div className="flex gap-2">
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={t('roleManagement.selectRole')} />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_ROLES.filter((r) => !user.roles.includes(r.value)).map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div>
                        <div className="font-medium">{role.label}</div>
                        <div className="text-xs text-muted-foreground">{role.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAssignRole}
                disabled={!selectedRole || assignMutation.isPending}
                size="sm"
              >
                {assignMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('roleManagement.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function RoleManagementSection() {
  const { t } = useTranslation();
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: users, isLoading } = useQuery({
    queryKey: ['users-with-roles'],
    queryFn: getUsersWithRoles,
  });

  const handleManageRoles = (user: UserWithRoles) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {t('roleManagement.title')}
          </CardTitle>
          <CardDescription>{t('roleManagement.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('roleManagement.email')}</TableHead>
                <TableHead>{t('roleManagement.roles')}</TableHead>
                <TableHead>{t('roleManagement.tenant')}</TableHead>
                <TableHead className="text-right">{t('roleManagement.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users && users.length > 0 ? (
                users.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles.length > 0 ? (
                          user.roles.map((role) => (
                            <Badge key={role} variant="secondary" className="text-xs">
                              {AVAILABLE_ROLES.find((r) => r.value === role)?.label || role}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            {t('roleManagement.noRoles')}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.tenant_name}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleManageRoles(user)}
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        {t('roleManagement.manage')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    {t('roleManagement.noUsers')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <RoleManagementDialog
        user={selectedUser}
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={() => setDialogOpen(false)}
      />
    </>
  );
}
