# 📘 User Guide - Backup & Recovery System

**Project:** Romuz Awareness - M23 Backup System  
**Version:** 1.0.0  
**Last Updated:** 2025-01-19

---

## 🎯 Overview

The M23 Backup & Recovery System provides comprehensive data protection through:
- ✅ Full and incremental backups
- ✅ Point-in-Time Recovery (PITR)
- ✅ Disaster Recovery Plans
- ✅ Health Monitoring

---

## 📋 Table of Contents

1. [Creating a Backup](#creating-a-backup)
2. [Restoring Data](#restoring-data)
3. [Point-in-Time Recovery (PITR)](#point-in-time-recovery-pitr)
4. [Rollback Operations](#rollback-operations)
5. [Disaster Recovery Plans](#disaster-recovery-plans)
6. [Troubleshooting](#troubleshooting)

---

## 📦 Creating a Backup

### Full Backup

**When to use:** First backup, or weekly baseline backup

**Steps:**
1. Navigate to **Backups** section
2. Click **Create New Backup**
3. Select backup type: **Full**
4. Enter backup name (optional)
5. Add description (optional)
6. Click **Create**

**Expected time:** 5-15 minutes depending on data size

---

### Incremental Backup

**When to use:** Daily quick backups after a full backup

**Steps:**
1. Ensure a full backup exists first
2. Navigate to **Backups**
3. Click **Create Incremental Backup**
4. Select base backup
5. Click **Create**

**Expected time:** 1-3 minutes (much faster than full backup)

---

## 🔄 Restoring Data

### Restore from Backup

**Warning:** ⚠️ Restore operation will replace current data

**Steps:**
1. Navigate to **Backup History**
2. Select desired backup
3. Click **Restore**
4. Review details carefully
5. ✅ **Confirm the operation**
6. Wait for completion

**Expected time:** 5-30 minutes depending on data size

---

## ⏱️ Point-in-Time Recovery (PITR)

### Restore to Specific Timestamp

**When to use:** Recover data to a specific point in time (e.g., before an error)

**Steps:**

#### 1. Preview Changes (Dry Run)
```
1. Navigate to **PITR**
2. Select target date and time
3. Choose **Preview Only** ✅
4. Review statistics:
   - Number of operations
   - Affected tables
   - Estimated time
```

#### 2. Execute Recovery
```
1. After preview and confirmation
2. Select same timestamp
3. ✅ Confirm recovery
4. **Automatic:** System creates snapshot before recovery
5. Wait for completion
```

**Important:** 🎯 System automatically creates a snapshot before recovery for rollback capability

---

## ↩️ Rollback Operations

### Restore Previous State

**When to use:** If recovery causes issues

**Steps:**
1. Navigate to **Snapshots**
2. View available snapshots
3. Select snapshot immediately before recovery
4. Click **Rollback**
5. ✅ Confirm operation
6. Wait for restoration to previous state

**Expected time:** 5-15 minutes

---

## 🛡️ Disaster Recovery Plans

### Create DR Plan

**Steps:**
1. Navigate to **Recovery Plans**
2. Click **Create New Plan**
3. Enter information:
   - Plan name
   - RTO (Recovery Time Objective - in minutes)
   - RPO (Recovery Point Objective - in minutes)
   - Backup frequency
   - Retention period
4. Click **Save**

### Execute Recovery Test

**Important:** Recommend testing DR plan monthly

**Steps:**
1. Select DR plan
2. Click **Execute Test**
3. Choose validation level:
   - Basic (fast)
   - Full (comprehensive)
   - Deep (very detailed)
4. Wait for results
5. Review report and recommendations

---

## ❗ Troubleshooting

### Issue: Backup Failed

**Possible Causes:**
- Insufficient storage space
- Connection interrupted
- Insufficient permissions

**Solution:**
1. Review error message
2. Check storage space
3. Retry operation

### Issue: Slow Restoration

**Solution:**
- Use specific tables instead of all
- Perform restoration during low-usage time
- Check system health

### Issue: Rollback Not Available

**Cause:**
- No snapshot created before recovery

**Solution:**
- Always run PITR with preview first
- Ensure automatic snapshot creation is enabled

### Issue: FK Constraint Violations

**Cause:**
- Data dependencies during restoration

**Solution:**
- System automatically handles FK constraints
- If issues persist, contact support

---

## 📊 Monitoring & Health

### Health Dashboard

**Access:** Navigate to **Health Monitoring**

**Metrics:**
- Backup success rate
- Storage utilization
- RTO/RPO compliance
- Last backup status

**Recommendations:**
- Check health dashboard weekly
- Review failed backups immediately
- Keep storage below 80% utilization

---

## 🔒 Security & Compliance

### Data Protection
- All backups are encrypted
- Tenant isolation enforced
- Role-based access control

### Audit Trail
- All operations are logged
- Review audit log regularly
- Track who accessed/modified backups

---

## 📞 Support

**Technical Support:** support@romuz.sa  
**Full Documentation:** [API Documentation](./M23_Backup_API_Documentation.md)  
**User Guide (Arabic):** [Arabic Guide](./M23_Backup_User_Guide_AR.md)

---

## 🎓 Best Practices

1. **Regular Backups:**
   - Full backup: Weekly
   - Incremental: Daily
   
2. **Test DR Plans:**
   - Monthly testing recommended
   - Document test results
   
3. **Monitor Health:**
   - Weekly health checks
   - Address warnings promptly
   
4. **Storage Management:**
   - Clean old backups regularly
   - Keep 30-90 days retention
   
5. **PITR Usage:**
   - Always preview first
   - Verify snapshot created
   - Test rollback capability

---

**Version History:**
- v1.0.0 (2025-01-19): Initial release
