import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";
import { Card } from "@/core/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/core/components/ui/dialog";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Plus, Radio, Mail, Webhook, Power, PowerOff } from "lucide-react";
import { toast } from "sonner";
import { canManageChannels, getUserRole } from "@/lib/gate-p/rbac";

interface Channel {
  id: string;
  tenant_id: string | null;
  channel_type: 'email' | 'slack' | 'webhook';
  config_json: any;
  is_active: boolean;
  created_at: string;
}

interface ChannelsManagementProps {
  tenantId: string;
}

export function ChannelsManagement({ tenantId }: ChannelsManagementProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [channelType, setChannelType] = useState<'email' | 'slack' | 'webhook'>('email');
  const [channelConfig, setChannelConfig] = useState('');
  const queryClient = useQueryClient();
  const role = getUserRole();

  const { data: channels, isLoading } = useQuery({
    queryKey: ['channels', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenant_notifications_channels')
        .select('*')
        .or(`tenant_id.eq.${tenantId},tenant_id.is.null`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Channel[];
    },
  });

  const addChannelMutation = useMutation({
    mutationFn: async ({ type, config }: { type: string; config: any }) => {
      const { error } = await supabase
        .from('tenant_notifications_channels')
        .insert({
          tenant_id: tenantId,
          channel_type: type,
          config_json: config,
          is_active: true,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels', tenantId] });
      toast.success('Channel added successfully');
      setShowAddDialog(false);
      setChannelConfig('');
    },
    onError: (error: any) => {
      toast.error(`Failed to add channel: ${error.message}`);
    },
  });

  const toggleChannelMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('tenant_notifications_channels')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels', tenantId] });
      toast.success('Channel status updated');
    },
    onError: (error: any) => {
      toast.error(`Failed to update channel: ${error.message}`);
    },
  });

  const handleAddChannel = () => {
    if (!canManageChannels(role)) {
      toast.error('Permission denied: Only admins can manage channels');
      return;
    }

    try {
      const config = channelConfig ? JSON.parse(channelConfig) : {};
      addChannelMutation.mutate({ type: channelType, config });
    } catch (e) {
      toast.error('Invalid JSON configuration');
    }
  };

  const handleToggleChannel = (id: string, currentStatus: boolean) => {
    if (!canManageChannels(role)) {
      toast.error('Permission denied: Only admins can manage channels');
      return;
    }

    toggleChannelMutation.mutate({ id, isActive: !currentStatus });
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'slack':
        return <Radio className="h-4 w-4" />;
      case 'webhook':
        return <Webhook className="h-4 w-4" />;
      default:
        return <Radio className="h-4 w-4" />;
    }
  };

  const getDefaultConfig = (type: string) => {
    switch (type) {
      case 'email':
        return JSON.stringify({ email: 'admin@example.com' }, null, 2);
      case 'slack':
        return JSON.stringify({ webhook_url: 'https://hooks.slack.com/services/...' }, null, 2);
      case 'webhook':
        return JSON.stringify({ webhook_url: 'https://example.com/webhook' }, null, 2);
      default:
        return '{}';
    }
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading channels...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Manage notification channels (Email/Slack/Webhook) for this tenant.
        </p>
        {canManageChannels(role) && (
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Channel
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Notification Channel</DialogTitle>
                <DialogDescription>
                  Configure a new notification channel for this tenant.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Channel Type</Label>
                  <div className="flex gap-2">
                    {(['email', 'slack', 'webhook'] as const).map((type) => (
                      <Button
                        key={type}
                        variant={channelType === type ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setChannelType(type);
                          setChannelConfig(getDefaultConfig(type));
                        }}
                      >
                        {getChannelIcon(type)}
                        <span className="ml-2 capitalize">{type}</span>
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Configuration (JSON)</Label>
                  <textarea
                    value={channelConfig}
                    onChange={(e) => setChannelConfig(e.target.value)}
                    className="w-full h-32 text-xs font-mono border rounded p-2"
                    placeholder={getDefaultConfig(channelType)}
                  />
                </div>
                <Button onClick={handleAddChannel} className="w-full">
                  Add Channel
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-2">
        {channels && channels.length > 0 ? (
          channels.map((channel) => (
            <Card key={channel.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {getChannelIcon(channel.channel_type)}
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium capitalize">
                        {channel.channel_type}
                      </p>
                      <Badge variant={channel.is_active ? 'default' : 'secondary'}>
                        {channel.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {!channel.tenant_id && (
                        <Badge variant="outline">Global</Badge>
                      )}
                    </div>
                    <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-20">
                      {JSON.stringify(channel.config_json, null, 2)}
                    </pre>
                  </div>
                </div>
                {canManageChannels(role) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleChannel(channel.id, channel.is_active)}
                  >
                    {channel.is_active ? (
                      <PowerOff className="h-4 w-4" />
                    ) : (
                      <Power className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No notification channels configured yet.
          </div>
        )}
      </div>
    </div>
  );
}
