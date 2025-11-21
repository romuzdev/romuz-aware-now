/**
 * M18 Part 2: Visual Workflow Designer Component
 * Drag-and-drop canvas for building playbook workflows
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Textarea } from '@/core/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { 
  Play, 
  Square, 
  Diamond, 
  Circle,
  GitBranch,
  Mail,
  Webhook,
  Clock,
  Plus,
  Trash2,
  Save,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkflowNode {
  id: string;
  type: 'start' | 'action' | 'condition' | 'notification' | 'delay' | 'end';
  label: string;
  description?: string;
  position: { x: number; y: number };
  config?: any;
  connections?: string[]; // IDs of connected nodes
}

interface WorkflowConnection {
  id: string;
  source: string;
  target: string;
  label?: string;
}

const NODE_TYPES = [
  { 
    type: 'action', 
    label: 'إجراء', 
    icon: Play, 
    color: 'bg-blue-500',
    description: 'تنفيذ إجراء محدد'
  },
  { 
    type: 'condition', 
    label: 'شرط', 
    icon: GitBranch, 
    color: 'bg-yellow-500',
    description: 'اتخاذ قرار بناءً على شرط'
  },
  { 
    type: 'notification', 
    label: 'إشعار', 
    icon: Mail, 
    color: 'bg-green-500',
    description: 'إرسال إشعار أو بريد'
  },
  { 
    type: 'delay', 
    label: 'تأخير', 
    icon: Clock, 
    color: 'bg-purple-500',
    description: 'انتظار فترة زمنية'
  },
  { 
    type: 'webhook', 
    label: 'Webhook', 
    icon: Webhook, 
    color: 'bg-orange-500',
    description: 'استدعاء API خارجي'
  },
];

interface VisualWorkflowDesignerProps {
  initialNodes?: WorkflowNode[];
  initialConnections?: WorkflowConnection[];
  onSave: (nodes: WorkflowNode[], connections: WorkflowConnection[]) => void;
}

export function VisualWorkflowDesigner({ 
  initialNodes = [],
  initialConnections = [],
  onSave 
}: VisualWorkflowDesignerProps) {
  const [nodes, setNodes] = useState<WorkflowNode[]>(initialNodes.length > 0 ? initialNodes : [
    { 
      id: 'start', 
      type: 'start', 
      label: 'بداية', 
      position: { x: 50, y: 100 },
      connections: []
    }
  ]);
  const [connections, setConnections] = useState<WorkflowConnection[]>(initialConnections);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'start': return Circle;
      case 'action': return Play;
      case 'condition': return GitBranch;
      case 'notification': return Mail;
      case 'delay': return Clock;
      case 'webhook': return Webhook;
      case 'end': return Square;
      default: return Circle;
    }
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'start': return 'bg-green-500';
      case 'action': return 'bg-blue-500';
      case 'condition': return 'bg-yellow-500';
      case 'notification': return 'bg-green-500';
      case 'delay': return 'bg-purple-500';
      case 'webhook': return 'bg-orange-500';
      case 'end': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const addNode = (type: string) => {
    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      type: type as any,
      label: `${type} جديد`,
      position: { x: 200 + nodes.length * 50, y: 200 + nodes.length * 20 },
      connections: []
    };
    setNodes([...nodes, newNode]);
  };

  const deleteNode = (nodeId: string) => {
    if (nodeId === 'start') return; // Cannot delete start node
    setNodes(nodes.filter(n => n.id !== nodeId));
    setConnections(connections.filter(c => c.source !== nodeId && c.target !== nodeId));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  };

  const updateNodePosition = (nodeId: string, position: { x: number; y: number }) => {
    setNodes(nodes.map(n => 
      n.id === nodeId ? { ...n, position } : n
    ));
  };

  const updateNodeConfig = (nodeId: string, config: any) => {
    setNodes(nodes.map(n => 
      n.id === nodeId ? { ...n, ...config } : n
    ));
  };

  const connectNodes = (sourceId: string, targetId: string) => {
    const newConnection: WorkflowConnection = {
      id: `conn-${Date.now()}`,
      source: sourceId,
      target: targetId,
    };
    setConnections([...connections, newConnection]);
    
    // Update source node connections
    setNodes(nodes.map(n => 
      n.id === sourceId 
        ? { ...n, connections: [...(n.connections || []), targetId] }
        : n
    ));
  };

  const handleSave = () => {
    onSave(nodes, connections);
  };

  const handleZoomIn = () => setZoom(Math.min(zoom + 0.1, 2));
  const handleZoomOut = () => setZoom(Math.max(zoom - 0.1, 0.5));

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <Card className="mb-4">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleSave}>
                <Save className="h-4 w-4 ml-2" />
                حفظ
              </Button>
              <Button variant="outline" size="sm">
                <Undo className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Redo className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium px-2">
                {Math.round(zoom * 100)}%
              </span>
              <Button variant="outline" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex-1 flex gap-4">
        {/* Node Palette */}
        <Card className="w-64 flex-shrink-0">
          <CardHeader>
            <CardTitle className="text-lg">العناصر</CardTitle>
            <CardDescription>
              اسحب العناصر إلى اللوحة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {NODE_TYPES.map((nodeType) => {
              const Icon = nodeType.icon;
              return (
                <button
                  key={nodeType.type}
                  onClick={() => addNode(nodeType.type)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors text-right"
                >
                  <div className={cn("p-2 rounded", nodeType.color)}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{nodeType.label}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {nodeType.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Canvas */}
        <Card className="flex-1 relative overflow-hidden bg-dot-pattern">
          <div 
            className="absolute inset-0 p-8"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
          >
            {/* Render Connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {connections.map((conn) => {
                const source = nodes.find(n => n.id === conn.source);
                const target = nodes.find(n => n.id === conn.target);
                if (!source || !target) return null;

                const x1 = source.position.x + 60;
                const y1 = source.position.y + 30;
                const x2 = target.position.x;
                const y2 = target.position.y + 30;

                return (
                  <g key={conn.id}>
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-border"
                      markerEnd="url(#arrowhead)"
                    />
                  </g>
                );
              })}
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                  className="text-border"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="currentColor" />
                </marker>
              </defs>
            </svg>

            {/* Render Nodes */}
            {nodes.map((node) => {
              const Icon = getNodeIcon(node.type);
              const colorClass = getNodeColor(node.type);
              
              return (
                <div
                  key={node.id}
                  className={cn(
                    "absolute flex items-center gap-2 px-4 py-3 rounded-lg border-2 bg-background cursor-move transition-all",
                    selectedNode?.id === node.id ? "border-primary shadow-lg scale-105" : "border-border hover:border-primary/50"
                  )}
                  style={{
                    left: node.position.x,
                    top: node.position.y,
                  }}
                  onClick={() => setSelectedNode(node)}
                  draggable
                  onDragStart={() => setDraggedNode(node.id)}
                  onDragEnd={(e) => {
                    if (draggedNode) {
                      const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                      if (rect) {
                        const x = (e.clientX - rect.left) / zoom;
                        const y = (e.clientY - rect.top) / zoom;
                        updateNodePosition(draggedNode, { x, y });
                      }
                      setDraggedNode(null);
                    }
                  }}
                >
                  <div className={cn("p-1.5 rounded", colorClass)}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium">{node.label}</span>
                  {node.id !== 'start' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 ml-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNode(node.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {nodes.length === 1 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center space-y-2">
                <p className="text-muted-foreground">
                  ابدأ بإضافة عناصر من القائمة الجانبية
                </p>
                <Badge variant="outline">اسحب أو انقر لإضافة</Badge>
              </div>
            </div>
          )}
        </Card>

        {/* Properties Panel */}
        {selectedNode && (
          <Card className="w-80 flex-shrink-0">
            <CardHeader>
              <CardTitle className="text-lg">خصائص العنصر</CardTitle>
              <CardDescription>{selectedNode.label}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>التسمية</Label>
                <Input
                  value={selectedNode.label}
                  onChange={(e) => updateNodeConfig(selectedNode.id, { label: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>الوصف</Label>
                <Textarea
                  value={selectedNode.description || ''}
                  onChange={(e) => updateNodeConfig(selectedNode.id, { description: e.target.value })}
                  rows={3}
                />
              </div>

              {selectedNode.type === 'delay' && (
                <div className="space-y-2">
                  <Label>مدة التأخير (بالدقائق)</Label>
                  <Input type="number" placeholder="30" />
                </div>
              )}

              {selectedNode.type === 'notification' && (
                <div className="space-y-2">
                  <Label>نوع الإشعار</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر النوع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">بريد إلكتروني</SelectItem>
                      <SelectItem value="slack">Slack</SelectItem>
                      <SelectItem value="teams">Teams</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedNode.type === 'condition' && (
                <div className="space-y-2">
                  <Label>الشرط</Label>
                  <Textarea placeholder="severity == 'high'" rows={2} />
                </div>
              )}

              <Button
                variant="destructive"
                className="w-full"
                onClick={() => deleteNode(selectedNode.id)}
                disabled={selectedNode.id === 'start'}
              >
                <Trash2 className="h-4 w-4 ml-2" />
                حذف العنصر
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
