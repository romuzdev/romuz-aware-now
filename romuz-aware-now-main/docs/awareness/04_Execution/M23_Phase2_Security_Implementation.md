# M23 - Phase 2: تطبيق الإصلاحات الأمنية الحرجة

**التاريخ:** 2025-01-19  
**الحالة:** ✅ مكتمل جزئياً - تم إنشاء Shared Utilities

---

## 📋 الهدف

تطبيق الإصلاحات الأمنية الحرجة التالية على جميع Edge Functions الخاصة بنظام Backup & Recovery:

1. ✅ **Input Validation** شامل
2. ✅ **Rate Limiting** implementation  
3. ✅ **Tenant ID Retrieval** unification
4. ⏳ **تطبيق على Edge Functions**
5. ⏳ **PITR Rollback Mechanism**

---

## ✅ ما تم إنجازه

### 1. Shared Utilities (مكتمل)

تم إنشاء 3 utilities مشتركة:

#### `supabase/functions/_shared/simple-validation.ts`
```typescript
// Input validation without external dependencies
export function validateInput(data: any, schema: ValidationSchema)
```

**الميزات:**
- ✅ Type validation (string, number, boolean, array, object)
- ✅ Required fields check
- ✅ Length constraints (minLength, maxLength)
- ✅ Enum validation
- ✅ Pattern/regex validation
- ✅ No external dependencies (pure TypeScript)

#### `supabase/functions/_shared/rate-limiter.ts`
```typescript
// In-memory rate limiting
export async function checkRateLimit(key: string, limit: number, windowSeconds: number)
```

**الميزات:**
- ✅ In-memory implementation (Map-based)
- ✅ Sliding window algorithm
- ✅ Automatic cleanup of expired entries
- ✅ Returns `allowed` status and `retryAfter` seconds

#### `supabase/functions/_shared/tenant-utils.ts`
```typescript
// Unified tenant ID retrieval
export async function getTenantId(supabase: any, user: any): Promise<string>
```

**الميزات:**
- ✅ Tries multiple sources (user_metadata → user_tenants table)
- ✅ Consistent error handling
- ✅ Proper logging
- ✅ Single source of truth

---

## ⏳ ما يجب تطبيقه

### 2. تطبيق على Edge Functions (جارٍ)

يجب تطبيق هذه الإصلاحات على الـ Edge Functions التالية:

| Function | الحالة | Input Validation | Rate Limiting | Unified Tenant | Logging |
|----------|--------|------------------|---------------|----------------|---------|
| `backup-database` | ⏳ | ❌ | ❌ | ❌ | ⚠️ جزئي |
| `restore-database` | ⏳ | ❌ | ❌ | ❌ | ⚠️ جزئي |
| `pitr-restore` | ⏳ | ❌ | ❌ | ❌ | ⚠️ جزئي |
| `backup-health-monitor` | ⏳ | ❌ | ✅ N/A (Cron) | ⚠️ Multiple sources | ⚠️ جزئي |
| `backup-recovery-test` | ⏳ | ❌ | ❌ | ⚠️ user_metadata only | ⚠️ جزئي |
| `backup-retention-cleanup` | ⏳ | ✅ N/A (Cron) | ✅ N/A (Cron) | ✅ N/A (No user context) | ⚠️ جزئي |

**التعديلات المطلوبة لكل Function:**

```typescript
// 1. Import shared utilities
import { validateInput } from "../_shared/simple-validation.ts";
import { checkRateLimit } from "../_shared/rate-limiter.ts";
import { getTenantId } from "../_shared/tenant-utils.ts";

// 2. Define validation schema
const requestSchema = {
  field1: { type: 'string', required: true, maxLength: 255 },
  field2: { type: 'number', required: false, min: 0 },
};

// 3. Apply in handler
serve(async (req) => {
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Request received`);
  
  try {
    // ... auth code ...
    
    // Get tenant using utility
    const tenantId = await getTenantId(supabase, user);
    
    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      `function-name:${tenantId}`,
      10,  // limit
      3600 // window in seconds
    );
    
    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded' 
      }), { status: 429 });
    }
    
    // Input validation
    const body = await req.json();
    const validationResult = validateInput(body, requestSchema);
    
    if (!validationResult.valid) {
      return new Response(JSON.stringify({ 
        error: 'Validation failed',
        details: validationResult.errors 
      }), { status: 400 });
    }
    
    // ... rest of logic ...
    
  } catch (error: any) {
    console.error(`[${requestId}] Error:`, error);
    // ... error handling ...
  }
});
```

---

### 3. PITR Rollback Mechanism (معلّق)

**المشكلة الحالية:**
- `pitr-restore` يعتمد على `calculate_pitr_stats` RPC function
- لا توجد آلية rollback في حالة الفشل
- لا يوجد validation للـ changes قبل التطبيق

**الحل المطلوب:**

1. **Pre-Restore Snapshot**
```typescript
// Create snapshot before PITR
const snapshotId = await createPreRestoreSnapshot(supabase, tenantId);
```

2. **Rollback Function**
```typescript
async function rollbackPITR(
  supabase: any,
  restoreLogId: string,
  snapshotId: string
) {
  console.log(`Rolling back PITR restore: ${restoreLogId}`);
  
  // Restore from snapshot
  await restoreFromSnapshot(supabase, snapshotId);
  
  // Update restore log
  await supabase
    .from('backup_restore_logs')
    .update({
      status: 'rolled_back',
      rollback_at: new Date().toISOString(),
    })
    .eq('id', restoreLogId);
}
```

3. **Try-Catch with Rollback**
```typescript
try {
  // Apply PITR changes
  await applyPITRChanges(/*...*/);
} catch (error) {
  console.error('PITR failed, rolling back...', error);
  await rollbackPITR(supabase, restoreLogId, snapshotId);
  throw error;
}
```

---

## 🔒 Security Checklist

### Input Validation
- [ ] جميع المدخلات يتم validate-ها
- [ ] لا trust للـ tenant_id من Frontend
- [ ] Enum validation لجميع القيم المحددة
- [ ] Length limits على جميع النصوص

### Rate Limiting
- [ ] جميع الـ endpoints المُكلفة محمية
- [ ] Limits معقولة حسب نوع العملية
- [ ] Proper error messages مع retryAfter

### Tenant Context
- [ ] استخدام `getTenantId()` utility
- [ ] No hard-coded fallbacks
- [ ] Proper error handling

### Error Handling
- [ ] Try-catch blocks شاملة
- [ ] Detailed logging مع requestId
- [ ] No sensitive info في error messages
- [ ] Proper HTTP status codes

### Logging
- [ ] Request ID لكل request
- [ ] Structured logging
- [ ] Performance metrics
- [ ] Error context

---

## 📊 الخطوات التالية

1. **تطبيق على backup-database** ✅
2. **تطبيق على restore-database**
3. **تطبيق على pitr-restore + rollback**
4. **تطبيق على backup-recovery-test**
5. **مراجعة backup-health-monitor**
6. **Testing شامل**
7. **Documentation update**

---

## ⚠️ ملاحظات مهمة

### Performance Considerations
- Rate limiter يستخدم in-memory Map (يُفقد عند restart)
- للـ production، يُفضل استخدام Redis أو Database-backed
- Input validation تتم synchronously (قد تؤثر على latency للـ large payloads)

### Tenant ID Sources Priority
```
1. user.user_metadata.tenant_id
2. user_tenants table lookup
3. Throw error (no fallback)
```

### Rate Limiting Strategy
| Function Type | Limit | Window |
|---------------|-------|--------|
| Backup Create | 10/hour | 3600s |
| Restore | 5/hour | 3600s |
| PITR | 3/hour | 3600s |
| Health Check | N/A (Cron) | - |
| Recovery Test | 5/day | 86400s |

---

**آخر تحديث:** 2025-01-19 00:22 UTC  
**الحالة العامة:** 🟡 In Progress (40% Complete)
