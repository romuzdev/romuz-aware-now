import { describe, it, expect } from 'vitest';
import { rolesHavePermission, type AppRole, type Permission, PERMISSIONS } from '@/integrations/supabase/rbac';

/**
 * Gate-U: Comprehensive RBAC Security Tests
 * 
 * Tests all security scenarios including:
 * - Route protection for each persona dashboard
 * - Permission-based sidebar filtering
 * - RBAC permission matrix validation
 * - Security edge cases and attack vectors
 */

describe('🔒 RBAC Security - Route Protection', () => {
  describe('Employee (👤) Dashboard Access', () => {
    const employeeRoles: AppRole[] = ['employee'];

    it('should allow access to User dashboard', () => {
      expect(rolesHavePermission(employeeRoles, 'route.user')).toBe(true);
    });

    it('should deny access to Awareness dashboard', () => {
      expect(rolesHavePermission(employeeRoles, 'route.awareness')).toBe(false);
    });

    it('should deny access to Risk dashboard', () => {
      expect(rolesHavePermission(employeeRoles, 'route.risk')).toBe(false);
    });

    it('should deny access to Admin dashboard', () => {
      expect(rolesHavePermission(employeeRoles, 'route.admin')).toBe(false);
    });

    it('should deny access to Executive dashboard', () => {
      expect(rolesHavePermission(employeeRoles, 'route.executive')).toBe(false);
    });

    it('should deny access to HR dashboard', () => {
      expect(rolesHavePermission(employeeRoles, 'route.hr')).toBe(false);
    });

    it('should deny access to IT dashboard', () => {
      expect(rolesHavePermission(employeeRoles, 'route.it')).toBe(false);
    });

    it('should deny access to Compliance dashboard', () => {
      expect(rolesHavePermission(employeeRoles, 'route.compliance')).toBe(false);
    });
  });

  describe('Awareness Manager (👨‍💼) Dashboard Access', () => {
    const awarenessRoles: AppRole[] = ['awareness_manager'];

    it('should allow access to User dashboard', () => {
      expect(rolesHavePermission(awarenessRoles, 'route.user')).toBe(true);
    });

    it('should allow access to Awareness dashboard', () => {
      expect(rolesHavePermission(awarenessRoles, 'route.awareness')).toBe(true);
    });

    it('should deny access to Risk dashboard', () => {
      expect(rolesHavePermission(awarenessRoles, 'route.risk')).toBe(false);
    });

    it('should deny access to Admin dashboard', () => {
      expect(rolesHavePermission(awarenessRoles, 'route.admin')).toBe(false);
    });

    it('should deny access to Executive dashboard', () => {
      expect(rolesHavePermission(awarenessRoles, 'route.executive')).toBe(false);
    });

    it('should deny access to HR dashboard', () => {
      expect(rolesHavePermission(awarenessRoles, 'route.hr')).toBe(false);
    });

    it('should deny access to IT dashboard', () => {
      expect(rolesHavePermission(awarenessRoles, 'route.it')).toBe(false);
    });

    it('should deny access to Compliance dashboard', () => {
      expect(rolesHavePermission(awarenessRoles, 'route.compliance')).toBe(false);
    });
  });

  describe('Risk Manager (🛡️) Dashboard Access', () => {
    const riskRoles: AppRole[] = ['risk_manager'];

    it('should allow access to User dashboard', () => {
      expect(rolesHavePermission(riskRoles, 'route.user')).toBe(true);
    });

    it('should deny access to Awareness dashboard', () => {
      expect(rolesHavePermission(riskRoles, 'route.awareness')).toBe(false);
    });

    it('should allow access to Risk dashboard', () => {
      expect(rolesHavePermission(riskRoles, 'route.risk')).toBe(true);
    });

    it('should deny access to Admin dashboard', () => {
      expect(rolesHavePermission(riskRoles, 'route.admin')).toBe(false);
    });
  });

  describe('Compliance Officer (📋) Dashboard Access', () => {
    const complianceRoles: AppRole[] = ['compliance_officer'];

    it('should allow access to User dashboard', () => {
      expect(rolesHavePermission(complianceRoles, 'route.user')).toBe(true);
    });

    it('should allow access to Compliance dashboard', () => {
      expect(rolesHavePermission(complianceRoles, 'route.compliance')).toBe(true);
    });

    it('should deny access to Admin dashboard', () => {
      expect(rolesHavePermission(complianceRoles, 'route.admin')).toBe(false);
    });

    it('should deny access to Risk dashboard', () => {
      expect(rolesHavePermission(complianceRoles, 'route.risk')).toBe(false);
    });
  });

  describe('HR Manager (👥) Dashboard Access', () => {
    const hrRoles: AppRole[] = ['hr_manager'];

    it('should allow access to User dashboard', () => {
      expect(rolesHavePermission(hrRoles, 'route.user')).toBe(true);
    });

    it('should allow access to HR dashboard', () => {
      expect(rolesHavePermission(hrRoles, 'route.hr')).toBe(true);
    });

    it('should deny access to Admin dashboard', () => {
      expect(rolesHavePermission(hrRoles, 'route.admin')).toBe(false);
    });
  });

  describe('IT Manager (💻) Dashboard Access', () => {
    const itRoles: AppRole[] = ['it_manager'];

    it('should allow access to User dashboard', () => {
      expect(rolesHavePermission(itRoles, 'route.user')).toBe(true);
    });

    it('should allow access to IT dashboard', () => {
      expect(rolesHavePermission(itRoles, 'route.it')).toBe(true);
    });

    it('should deny access to Admin dashboard', () => {
      expect(rolesHavePermission(itRoles, 'route.admin')).toBe(false);
    });
  });

  describe('Executive (📊) Dashboard Access', () => {
    const executiveRoles: AppRole[] = ['executive'];

    it('should allow access to User dashboard', () => {
      expect(rolesHavePermission(executiveRoles, 'route.user')).toBe(true);
    });

    it('should allow access to Executive dashboard', () => {
      expect(rolesHavePermission(executiveRoles, 'route.executive')).toBe(true);
    });

    it('should deny access to Admin dashboard', () => {
      expect(rolesHavePermission(executiveRoles, 'route.admin')).toBe(false);
    });
  });

  describe('Tenant Admin (👔) Dashboard Access', () => {
    const adminRoles: AppRole[] = ['tenant_admin'];

    it('should allow access to ALL dashboards', () => {
      const allRoutes: Permission[] = [
        'route.user',
        'route.awareness',
        'route.risk',
        'route.admin',
        'route.executive',
        'route.hr',
        'route.it',
        'route.compliance',
      ];

      allRoutes.forEach(route => {
        expect(rolesHavePermission(adminRoles, route)).toBe(true);
      });
    });
  });

  describe('Super Admin (⚡) Dashboard Access', () => {
    const superAdminRoles: AppRole[] = ['super_admin'];

    it('should allow access to ALL dashboards', () => {
      const allRoutes: Permission[] = [
        'route.user',
        'route.awareness',
        'route.risk',
        'route.admin',
        'route.executive',
        'route.hr',
        'route.it',
        'route.compliance',
      ];

      allRoutes.forEach(route => {
        expect(rolesHavePermission(superAdminRoles, route)).toBe(true);
      });
    });
  });
});

describe('🎯 RBAC Security - Sidebar Filtering', () => {
  describe('Employee Sidebar Visibility', () => {
    const employeeRoles: AppRole[] = ['employee'];

    it('should show User menu item only', () => {
      expect(rolesHavePermission(employeeRoles, 'route.user')).toBe(true);
    });

    it('should hide all other menu items', () => {
      const hiddenRoutes: Permission[] = [
        'route.awareness',
        'route.risk',
        'route.admin',
        'route.executive',
        'route.hr',
        'route.it',
        'route.compliance',
      ];

      hiddenRoutes.forEach(route => {
        expect(rolesHavePermission(employeeRoles, route)).toBe(false);
      });
    });
  });

  describe('Multi-Role User Sidebar Visibility', () => {
    const multiRoles: AppRole[] = ['awareness_manager', 'risk_manager'];

    it('should show User menu item', () => {
      expect(rolesHavePermission(multiRoles, 'route.user')).toBe(true);
    });

    it('should show Awareness menu item', () => {
      expect(rolesHavePermission(multiRoles, 'route.awareness')).toBe(true);
    });

    it('should show Risk menu item', () => {
      expect(rolesHavePermission(multiRoles, 'route.risk')).toBe(true);
    });

    it('should hide Admin menu item', () => {
      expect(rolesHavePermission(multiRoles, 'route.admin')).toBe(false);
    });

    it('should hide Executive menu item', () => {
      expect(rolesHavePermission(multiRoles, 'route.executive')).toBe(false);
    });
  });

  describe('Admin Sidebar Visibility', () => {
    const adminRoles: AppRole[] = ['tenant_admin'];

    it('should show all menu items', () => {
      const allRoutes: Permission[] = [
        'route.user',
        'route.awareness',
        'route.risk',
        'route.admin',
        'route.executive',
        'route.hr',
        'route.it',
        'route.compliance',
      ];

      allRoutes.forEach(route => {
        expect(rolesHavePermission(adminRoles, route)).toBe(true);
      });
    });
  });
});

describe('🔐 RBAC Security - Permission Matrix Validation', () => {
  describe('Permission Structure Integrity', () => {
    it('should have all route permissions defined', () => {
      const requiredRoutePermissions = [
        'route.user',
        'route.awareness',
        'route.risk',
        'route.admin',
        'route.executive',
        'route.hr',
        'route.it',
        'route.compliance',
      ];

      requiredRoutePermissions.forEach(permission => {
        expect(PERMISSIONS[permission as Permission]).toBeDefined();
        expect(Array.isArray(PERMISSIONS[permission as Permission])).toBe(true);
        expect(PERMISSIONS[permission as Permission].length).toBeGreaterThan(0);
      });
    });

    it('should have valid role assignments for each permission', () => {
      const validRoles: AppRole[] = [
        'super_admin',
        'tenant_admin',
        'awareness_manager',
        'risk_manager',
        'compliance_officer',
        'hr_manager',
        'it_manager',
        'executive',
        'employee',
        'admin',
        'analyst',
        'manager',
        'viewer',
      ];

      Object.values(PERMISSIONS).forEach(rolesList => {
        rolesList.forEach(role => {
          expect(validRoles).toContain(role as AppRole);
        });
      });
    });
  });

  describe('Hierarchical Permission Testing', () => {
    it('super_admin should have all permissions', () => {
      const superAdminRoles: AppRole[] = ['super_admin'];
      const allPermissions = Object.keys(PERMISSIONS) as Permission[];

      const hasAllPermissions = allPermissions.every(permission =>
        rolesHavePermission(superAdminRoles, permission)
      );

      expect(hasAllPermissions).toBe(true);
    });

    it('employee should have minimal permissions', () => {
      const employeeRoles: AppRole[] = ['employee'];
      const restrictedPermissions: Permission[] = [
        'manage_campaigns',
        'manage_policies',
        'manage_users',
        'view_audit',
        'export_reports',
      ];

      restrictedPermissions.forEach(permission => {
        expect(rolesHavePermission(employeeRoles, permission)).toBe(false);
      });
    });
  });

  describe('Cross-Functional Permission Testing', () => {
    it('awareness_manager should manage campaigns', () => {
      const awarenessRoles: AppRole[] = ['awareness_manager'];
      expect(rolesHavePermission(awarenessRoles, 'manage_campaigns')).toBe(true);
      expect(rolesHavePermission(awarenessRoles, 'campaigns.manage')).toBe(true);
    });

    it('compliance_officer should manage policies', () => {
      const complianceRoles: AppRole[] = ['compliance_officer'];
      expect(rolesHavePermission(complianceRoles, 'manage_policies')).toBe(true);
    });

    it('hr_manager should manage users', () => {
      const hrRoles: AppRole[] = ['hr_manager'];
      expect(rolesHavePermission(hrRoles, 'manage_users')).toBe(true);
    });

    it('executive should view reports but not export', () => {
      const executiveRoles: AppRole[] = ['executive'];
      expect(rolesHavePermission(executiveRoles, 'view_reports')).toBe(true);
      expect(rolesHavePermission(executiveRoles, 'export_reports')).toBe(false);
    });
  });
});

describe('🚨 RBAC Security - Edge Cases & Attack Vectors', () => {
  describe('Empty Role Array', () => {
    const emptyRoles: AppRole[] = [];

    it('should deny all permissions with no roles', () => {
      const criticalPermissions: Permission[] = [
        'route.admin',
        'route.awareness',
        'manage_campaigns',
        'manage_policies',
        'manage_users',
        'view_audit',
      ];

      criticalPermissions.forEach(permission => {
        expect(rolesHavePermission(emptyRoles, permission)).toBe(false);
      });
    });
  });

  describe('Invalid Role Values', () => {
    it('should handle non-existent roles safely', () => {
      const invalidRoles = ['hacker', 'superuser', 'root'] as any as AppRole[];
      
      expect(rolesHavePermission(invalidRoles, 'route.admin')).toBe(false);
      expect(rolesHavePermission(invalidRoles, 'manage_users')).toBe(false);
    });
  });

  describe('Case Sensitivity', () => {
    it('should be case-sensitive for role matching', () => {
      const wrongCaseRoles = ['EMPLOYEE', 'Employee', 'ADMIN'] as any as AppRole[];
      
      expect(rolesHavePermission(wrongCaseRoles, 'route.user')).toBe(false);
      expect(rolesHavePermission(wrongCaseRoles, 'route.admin')).toBe(false);
    });
  });

  describe('Privilege Escalation Prevention', () => {
    it('should not allow employee to escalate to admin', () => {
      const employeeRoles: AppRole[] = ['employee'];
      
      // Attempt to access admin-only features
      expect(rolesHavePermission(employeeRoles, 'route.admin')).toBe(false);
      expect(rolesHavePermission(employeeRoles, 'manage_users')).toBe(false);
      expect(rolesHavePermission(employeeRoles, 'view_audit')).toBe(false);
    });

    it('should not allow viewer to perform management actions', () => {
      const viewerRoles: AppRole[] = ['viewer'];
      
      expect(rolesHavePermission(viewerRoles, 'manage_campaigns')).toBe(false);
      expect(rolesHavePermission(viewerRoles, 'manage_policies')).toBe(false);
      expect(rolesHavePermission(viewerRoles, 'export_reports')).toBe(false);
    });
  });

  describe('Multiple Roles - Cumulative Permissions', () => {
    it('should grant union of permissions from multiple roles', () => {
      const multiRoles: AppRole[] = ['awareness_manager', 'compliance_officer'];
      
      // Should have awareness_manager permissions
      expect(rolesHavePermission(multiRoles, 'route.awareness')).toBe(true);
      expect(rolesHavePermission(multiRoles, 'manage_campaigns')).toBe(true);
      
      // Should have compliance_officer permissions
      expect(rolesHavePermission(multiRoles, 'route.compliance')).toBe(true);
      expect(rolesHavePermission(multiRoles, 'manage_policies')).toBe(true);
      
      // Should not have admin permissions
      expect(rolesHavePermission(multiRoles, 'route.admin')).toBe(false);
    });
  });

  describe('Legacy Role Compatibility', () => {
    it('should support legacy admin role', () => {
      const legacyAdminRoles: AppRole[] = ['admin'];
      
      expect(rolesHavePermission(legacyAdminRoles, 'view_reports')).toBe(true);
      expect(rolesHavePermission(legacyAdminRoles, 'manage_campaigns')).toBe(true);
      expect(rolesHavePermission(legacyAdminRoles, 'route.admin')).toBe(true);
    });

    it('should support legacy manager role', () => {
      const legacyManagerRoles: AppRole[] = ['manager'];
      
      expect(rolesHavePermission(legacyManagerRoles, 'view_campaigns')).toBe(true);
      expect(rolesHavePermission(legacyManagerRoles, 'manage_campaigns')).toBe(true);
    });

    it('should support legacy viewer role', () => {
      const legacyViewerRoles: AppRole[] = ['viewer'];
      
      expect(rolesHavePermission(legacyViewerRoles, 'view_campaigns')).toBe(true);
      expect(rolesHavePermission(legacyViewerRoles, 'manage_campaigns')).toBe(false);
    });
  });
});

describe('📊 RBAC Security - Comprehensive Coverage Report', () => {
  it('should verify all route permissions are properly protected', () => {
    const allRoutes: Permission[] = [
      'route.user',
      'route.awareness',
      'route.risk',
      'route.admin',
      'route.executive',
      'route.hr',
      'route.it',
      'route.compliance',
    ];

    allRoutes.forEach(route => {
      const allowedRoles = PERMISSIONS[route];
      expect(allowedRoles).toBeDefined();
      expect(allowedRoles.length).toBeGreaterThan(0);
    });
  });

  it('should ensure employee has minimal but sufficient access', () => {
    const employeeRoles: AppRole[] = ['employee'];
    
    // Should have access to basic features
    expect(rolesHavePermission(employeeRoles, 'route.user')).toBe(true);
    expect(rolesHavePermission(employeeRoles, 'view_campaigns')).toBe(true);
    expect(rolesHavePermission(employeeRoles, 'view_policies')).toBe(true);
    expect(rolesHavePermission(employeeRoles, 'documents.view')).toBe(true);
    
    // Should NOT have access to management features
    expect(rolesHavePermission(employeeRoles, 'manage_campaigns')).toBe(false);
    expect(rolesHavePermission(employeeRoles, 'manage_policies')).toBe(false);
    expect(rolesHavePermission(employeeRoles, 'manage_users')).toBe(false);
    expect(rolesHavePermission(employeeRoles, 'documents.delete')).toBe(false);
  });

  it('should verify separation of concerns between roles', () => {
    // Awareness Manager should not access Risk features
    expect(rolesHavePermission(['awareness_manager'], 'route.risk')).toBe(false);
    
    // Risk Manager should not access Awareness features
    expect(rolesHavePermission(['risk_manager'], 'route.awareness')).toBe(false);
    
    // HR Manager should not access IT features
    expect(rolesHavePermission(['hr_manager'], 'route.it')).toBe(false);
    
    // IT Manager should not access HR features
    expect(rolesHavePermission(['it_manager'], 'route.hr')).toBe(false);
  });
});
