// ============================================================================
// Gate-H: Dependencies Integration Layer
// ============================================================================

import { supabase } from "@/integrations/supabase/client";
import type {
  ActionDependency,
  CreateDependencyInput,
  UpdateDependencyInput,
} from "../types/dependencies.types";

// ============================================================
// 1) Get Dependencies for Action
// ============================================================
export async function getDependencies(
  actionId: string
): Promise<ActionDependency[]> {
  const { data, error } = await supabase.rpc("fn_gate_h_get_dependencies", {
    p_action_id: actionId,
  });

  if (error) {
    console.error("getDependencies error:", error);
    throw new Error(`فشل جلب التبعيات: ${error.message}`);
  }

  return data || [];
}

// ============================================================
// 2) Create Dependency
// ============================================================
export async function createDependency(
  input: CreateDependencyInput
): Promise<ActionDependency> {
  const { data, error } = await supabase
    .from("action_plan_dependencies")
    .insert({
      source_action_id: input.sourceActionId,
      target_action_id: input.targetActionId,
      dependency_type: input.dependencyType,
      lag_days: input.lagDays,
      notes_ar: input.notesAr || null,
      created_by: (await supabase.auth.getUser()).data.user?.id!,
    })
    .select()
    .single();

  if (error) {
    console.error("createDependency error:", error);
    throw new Error(`فشل إنشاء التبعية: ${error.message}`);
  }

  return data;
}

// ============================================================
// 3) Update Dependency
// ============================================================
export async function updateDependency(
  input: UpdateDependencyInput
): Promise<ActionDependency> {
  const updateData: any = {};

  if (input.dependencyType) updateData.dependency_type = input.dependencyType;
  if (input.lagDays !== undefined) updateData.lag_days = input.lagDays;
  if (input.isActive !== undefined) updateData.is_active = input.isActive;
  if (input.notesAr !== undefined) updateData.notes_ar = input.notesAr;

  const { data, error } = await supabase
    .from("action_plan_dependencies")
    .update(updateData)
    .eq("id", input.dependencyId)
    .select()
    .single();

  if (error) {
    console.error("updateDependency error:", error);
    throw new Error(`فشل تحديث التبعية: ${error.message}`);
  }

  return data;
}

// ============================================================
// 4) Delete Dependency
// ============================================================
export async function deleteDependency(dependencyId: string): Promise<void> {
  const { error } = await supabase
    .from("action_plan_dependencies")
    .delete()
    .eq("id", dependencyId);

  if (error) {
    console.error("deleteDependency error:", error);
    throw new Error(`فشل حذف التبعية: ${error.message}`);
  }
}

// ============================================================
// 5) Check for Circular Dependencies
// ============================================================
export async function checkCircularDependencies(
  sourceActionId: string,
  targetActionId: string
): Promise<boolean> {
  // Get all dependencies
  const { data: allDeps, error } = await supabase
    .from("action_plan_dependencies")
    .select("source_action_id, target_action_id")
    .eq("is_active", true);

  if (error) {
    console.error("checkCircularDependencies error:", error);
    return false;
  }

  // Build adjacency list
  const graph = new Map<string, string[]>();
  allDeps?.forEach((dep) => {
    if (!graph.has(dep.source_action_id)) {
      graph.set(dep.source_action_id, []);
    }
    graph.get(dep.source_action_id)!.push(dep.target_action_id);
  });

  // Add proposed dependency
  if (!graph.has(sourceActionId)) {
    graph.set(sourceActionId, []);
  }
  graph.get(sourceActionId)!.push(targetActionId);

  // DFS to detect cycle
  const visited = new Set<string>();
  const recStack = new Set<string>();

  function hasCycle(node: string): boolean {
    visited.add(node);
    recStack.add(node);

    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (hasCycle(neighbor)) return true;
      } else if (recStack.has(neighbor)) {
        return true;
      }
    }

    recStack.delete(node);
    return false;
  }

  return hasCycle(sourceActionId);
}

// ============================================================
// Roadmap Compatibility Aliases
// ============================================================

/**
 * Alias for getDependencies - matches Roadmap specification
 * Returns all dependencies for a given action (both upstream and downstream)
 * @see getDependencies
 */
export const checkDependencies = getDependencies;

