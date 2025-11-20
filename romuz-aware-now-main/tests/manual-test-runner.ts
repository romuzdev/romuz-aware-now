/**
 * Manual Test Runner - للتحقق من صحة الاختبارات
 * 
 * هذا الملف يشغل الاختبارات يدوياً للتحقق من النتائج
 */

import { rolesHavePermission, type AppRole, PERMISSIONS } from '@/integrations/supabase/rbac';

interface TestResult {
  category: string;
  testName: string;
  passed: boolean;
  expected: boolean;
  actual: boolean;
}

const results: TestResult[] = [];

function test(category: string, testName: string, assertion: boolean, expected: boolean = true) {
  const passed = assertion === expected;
  results.push({
    category,
    testName,
    passed,
    expected,
    actual: assertion,
  });
  return passed;
}

console.log('🚀 بدء تشغيل الاختبارات اليدوية...\n');

// ============= Route Protection Tests =============
console.log('🔒 اختبارات حماية المسارات\n');

// Employee Tests
const employeeRoles: AppRole[] = ['employee'];
test('Employee', 'يصل إلى User Dashboard', rolesHavePermission(employeeRoles, 'route.user'), true);
test('Employee', 'ممنوع من Awareness', rolesHavePermission(employeeRoles, 'route.awareness'), false);
test('Employee', 'ممنوع من Risk', rolesHavePermission(employeeRoles, 'route.risk'), false);
test('Employee', 'ممنوع من Admin', rolesHavePermission(employeeRoles, 'route.admin'), false);
test('Employee', 'ممنوع من Executive', rolesHavePermission(employeeRoles, 'route.executive'), false);
test('Employee', 'ممنوع من HR', rolesHavePermission(employeeRoles, 'route.hr'), false);
test('Employee', 'ممنوع من IT', rolesHavePermission(employeeRoles, 'route.it'), false);
test('Employee', 'ممنوع من Compliance', rolesHavePermission(employeeRoles, 'route.compliance'), false);

// Awareness Manager Tests
const awarenessRoles: AppRole[] = ['awareness_manager'];
test('Awareness Manager', 'يصل إلى User Dashboard', rolesHavePermission(awarenessRoles, 'route.user'), true);
test('Awareness Manager', 'يصل إلى Awareness Dashboard', rolesHavePermission(awarenessRoles, 'route.awareness'), true);
test('Awareness Manager', 'ممنوع من Risk', rolesHavePermission(awarenessRoles, 'route.risk'), false);
test('Awareness Manager', 'ممنوع من Admin', rolesHavePermission(awarenessRoles, 'route.admin'), false);

// Risk Manager Tests
const riskRoles: AppRole[] = ['risk_manager'];
test('Risk Manager', 'يصل إلى User Dashboard', rolesHavePermission(riskRoles, 'route.user'), true);
test('Risk Manager', 'يصل إلى Risk Dashboard', rolesHavePermission(riskRoles, 'route.risk'), true);
test('Risk Manager', 'ممنوع من Awareness', rolesHavePermission(riskRoles, 'route.awareness'), false);
test('Risk Manager', 'ممنوع من Admin', rolesHavePermission(riskRoles, 'route.admin'), false);

// Tenant Admin Tests
const adminRoles: AppRole[] = ['tenant_admin'];
test('Tenant Admin', 'يصل إلى User', rolesHavePermission(adminRoles, 'route.user'), true);
test('Tenant Admin', 'يصل إلى Awareness', rolesHavePermission(adminRoles, 'route.awareness'), true);
test('Tenant Admin', 'يصل إلى Risk', rolesHavePermission(adminRoles, 'route.risk'), true);
test('Tenant Admin', 'يصل إلى Admin', rolesHavePermission(adminRoles, 'route.admin'), true);
test('Tenant Admin', 'يصل إلى Executive', rolesHavePermission(adminRoles, 'route.executive'), true);
test('Tenant Admin', 'يصل إلى HR', rolesHavePermission(adminRoles, 'route.hr'), true);
test('Tenant Admin', 'يصل إلى IT', rolesHavePermission(adminRoles, 'route.it'), true);
test('Tenant Admin', 'يصل إلى Compliance', rolesHavePermission(adminRoles, 'route.compliance'), true);

// Super Admin Tests
const superAdminRoles: AppRole[] = ['super_admin'];
test('Super Admin', 'يصل إلى جميع المسارات (8/8)', 
  ['route.user', 'route.awareness', 'route.risk', 'route.admin', 'route.executive', 'route.hr', 'route.it', 'route.compliance']
    .every(route => rolesHavePermission(superAdminRoles, route as any)), 
  true
);

// ============= Sidebar Filtering Tests =============
console.log('\n🎯 اختبارات فلترة القائمة الجانبية\n');

test('Sidebar', 'Employee يرى قائمة واحدة فقط', 
  ['route.user', 'route.awareness', 'route.risk', 'route.admin', 'route.executive', 'route.hr', 'route.it', 'route.compliance']
    .filter(route => rolesHavePermission(employeeRoles, route as any)).length === 1,
  true
);

test('Sidebar', 'Awareness Manager يرى قائمتين (User + Awareness)', 
  ['route.user', 'route.awareness', 'route.risk', 'route.admin']
    .filter(route => rolesHavePermission(awarenessRoles, route as any)).length === 2,
  true
);

test('Sidebar', 'Admin يرى جميع القوائم (8/8)', 
  ['route.user', 'route.awareness', 'route.risk', 'route.admin', 'route.executive', 'route.hr', 'route.it', 'route.compliance']
    .filter(route => rolesHavePermission(adminRoles, route as any)).length === 8,
  true
);

// ============= Permission Matrix Tests =============
console.log('\n🔐 اختبارات مصفوفة الصلاحيات\n');

test('Permissions', 'Awareness Manager يدير الحملات', 
  rolesHavePermission(awarenessRoles, 'manage_campaigns'), 
  true
);

test('Permissions', 'Compliance Officer يدير السياسات', 
  rolesHavePermission(['compliance_officer'], 'manage_policies'), 
  true
);

test('Permissions', 'HR Manager يدير المستخدمين', 
  rolesHavePermission(['hr_manager'], 'manage_users'), 
  true
);

test('Permissions', 'Executive يرى التقارير ولا يصدّرها', 
  rolesHavePermission(['executive'], 'view_reports') && 
  !rolesHavePermission(['executive'], 'export_reports'), 
  true
);

test('Permissions', 'Employee لا يدير الحملات', 
  rolesHavePermission(employeeRoles, 'manage_campaigns'), 
  false
);

test('Permissions', 'Employee لا يدير المستخدمين', 
  rolesHavePermission(employeeRoles, 'manage_users'), 
  false
);

// ============= Security Edge Cases =============
console.log('\n🚨 اختبارات الأمان والهجمات\n');

// Empty Roles
const emptyRoles: AppRole[] = [];
test('Security', 'أدوار فارغة → لا صلاحيات للـ Admin', 
  rolesHavePermission(emptyRoles, 'route.admin'), 
  false
);

test('Security', 'أدوار فارغة → لا صلاحيات إدارة المستخدمين', 
  rolesHavePermission(emptyRoles, 'manage_users'), 
  false
);

// Invalid Roles
const invalidRoles = ['hacker', 'superuser'] as any as AppRole[];
test('Security', 'أدوار غير صحيحة → لا وصول للـ Admin', 
  rolesHavePermission(invalidRoles, 'route.admin'), 
  false
);

test('Security', 'أدوار غير صحيحة → لا إدارة للمستخدمين', 
  rolesHavePermission(invalidRoles, 'manage_users'), 
  false
);

// Case Sensitivity
const wrongCaseRoles = ['EMPLOYEE', 'Employee'] as any as AppRole[];
test('Security', 'حساسية الأحرف → EMPLOYEE ≠ employee', 
  rolesHavePermission(wrongCaseRoles, 'route.user'), 
  false
);

// Privilege Escalation Prevention
test('Security', 'منع التصعيد → Employee لا يصل للـ Admin', 
  rolesHavePermission(employeeRoles, 'route.admin'), 
  false
);

test('Security', 'منع التصعيد → Employee لا يدير المستخدمين', 
  rolesHavePermission(employeeRoles, 'manage_users'), 
  false
);

test('Security', 'منع التصعيد → Viewer لا يدير الحملات', 
  rolesHavePermission(['viewer'], 'manage_campaigns'), 
  false
);

// Multiple Roles - Cumulative Permissions
const multiRoles: AppRole[] = ['awareness_manager', 'risk_manager'];
test('Security', 'أدوار متعددة → صلاحيات مدمجة (Awareness)', 
  rolesHavePermission(multiRoles, 'route.awareness'), 
  true
);

test('Security', 'أدوار متعددة → صلاحيات مدمجة (Risk)', 
  rolesHavePermission(multiRoles, 'route.risk'), 
  true
);

test('Security', 'أدوار متعددة → لا Admin', 
  rolesHavePermission(multiRoles, 'route.admin'), 
  false
);

// ============= Print Results =============
console.log('\n' + '='.repeat(60));
console.log('📊 ملخص النتائج');
console.log('='.repeat(60) + '\n');

const categories = [...new Set(results.map(r => r.category))];

categories.forEach(category => {
  const categoryResults = results.filter(r => r.category === category);
  const passed = categoryResults.filter(r => r.passed).length;
  const total = categoryResults.length;
  const percentage = ((passed / total) * 100).toFixed(1);
  
  console.log(`\n${category}:`);
  console.log(`  ✅ نجح: ${passed}/${total} (${percentage}%)`);
  
  const failed = categoryResults.filter(r => !r.passed);
  if (failed.length > 0) {
    console.log(`  ❌ فشل: ${failed.length}`);
    failed.forEach(f => {
      console.log(`     - ${f.testName} (توقع: ${f.expected}, فعلي: ${f.actual})`);
    });
  }
});

const totalPassed = results.filter(r => r.passed).length;
const totalTests = results.length;
const overallPercentage = ((totalPassed / totalTests) * 100).toFixed(1);

console.log('\n' + '='.repeat(60));
console.log(`📈 النتيجة الإجمالية: ${totalPassed}/${totalTests} (${overallPercentage}%)`);
console.log('='.repeat(60));

if (totalPassed === totalTests) {
  console.log('\n🎉 ممتاز! جميع الاختبارات نجحت!\n');
} else {
  console.log(`\n⚠️ تحذير: ${totalTests - totalPassed} اختبار فشل\n`);
}

// Export results for programmatic access
export { results, totalPassed, totalTests };
