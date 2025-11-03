# Points System Deployment Checklist

Use this checklist to ensure successful deployment of the points system.

## Pre-Deployment

### 1. Backup Database
- [ ] Create full database backup in Supabase Dashboard
- [ ] Note backup timestamp: `_________________`
- [ ] Verify backup completed successfully

### 2. Review Documentation
- [ ] Read `POINTS_DEPLOYMENT_GUIDE.md`
- [ ] Understand the architecture (`POINTS_TABLES_FIX_SUMMARY.md`)
- [ ] Review quick reference (`POINTS_QUICK_REFERENCE.md`)

### 3. Prepare Environment
- [ ] Access to Supabase SQL Editor
- [ ] Admin access to database
- [ ] Test store ID ready: `_________________`

## Deployment Steps

### Step 1: Verify Current State
- [ ] Run verification script: `script/verify-points-tables.sql`
- [ ] Document results:
  - [ ] Tables exist? YES / NO
  - [ ] If YES, have required columns? YES / NO
  - [ ] If NO, proceed with Step 2

### Step 2: Apply Base Migration (if needed)
- [ ] Open `supabase/migrations/20251031000000_create_base_points_tables.sql`
- [ ] Copy contents to Supabase SQL Editor
- [ ] Execute migration
- [ ] Verify no errors
- [ ] Check tables created:
  ```sql
  SELECT tablename FROM pg_tables
  WHERE tablename IN ('points', 'point_transactions');
  ```
- [ ] Result shows 2 tables

### Step 3: Apply Enhancement Migration
- [ ] Open `supabase/migrations/20251101000000_create_customer_points_system.sql`
- [ ] Copy contents to Supabase SQL Editor
- [ ] Execute migration
- [ ] Verify no errors
- [ ] Check new columns added:
  ```sql
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'points'
  AND column_name IN ('customer_phone', 'store_id');
  ```
- [ ] Result shows both columns

### Step 4: Verify Complete Installation
- [ ] Run full verification script again
- [ ] All checks show ✅ (green checkmarks)
- [ ] Function exists: `calculate_order_points()`
- [ ] Indexes created on key columns
- [ ] RLS policies active

## Testing

### Step 5: Seed Test Data (Development Only)
- [ ] **SKIP IN PRODUCTION**
- [ ] Update store ID in `script/seed-test-points-data.sql`
- [ ] Execute seed script
- [ ] Verify test data appears in tables

### Step 6: End-to-End Test
- [ ] Create test customer (phone: `_________________`)
- [ ] Create test order with:
  - [ ] Payment status: 'paid'
  - [ ] Service type: kilo, unit, or combined
  - [ ] Note quantity: `_________________`
  - [ ] Expected points: `_________________`
- [ ] Verify points awarded:
  ```sql
  SELECT customer_phone, current_points, accumulated_points
  FROM points
  WHERE customer_phone = 'YOUR_TEST_PHONE';
  ```
- [ ] Points match expected amount
- [ ] Transaction recorded in `point_transactions`
- [ ] Order has `points_earned` value
- [ ] WhatsApp notification includes points (if enabled)

## Post-Deployment

### Step 7: Monitor for Issues
**First Hour:**
- [ ] Check application logs for errors
- [ ] Monitor Supabase logs in Dashboard
- [ ] Verify real orders are awarding points

**First Day:**
- [ ] Review point awarding statistics
  ```sql
  SELECT COUNT(*), SUM(points_earned)
  FROM orders
  WHERE created_at >= CURRENT_DATE
  AND points_earned > 0;
  ```
- [ ] Check for error patterns
- [ ] Gather initial user feedback

**First Week:**
- [ ] Analyze point distribution
- [ ] Verify no data integrity issues
- [ ] Plan UI development phase

### Step 8: Documentation Update
- [ ] Update internal deployment docs with actual experience
- [ ] Document any issues encountered and solutions
- [ ] Note any deviations from guide
- [ ] Update team on status

## Rollback Plan (If Needed)

### Emergency Rollback Steps
**Only if critical issues occur:**

- [ ] Document the issue: `_________________`
- [ ] Export data before rollback:
  ```sql
  SELECT * FROM points;
  SELECT * FROM point_transactions;
  ```
- [ ] Execute rollback migration:
  `ROLLBACK_20251031000000_create_base_points_tables.sql`
- [ ] Verify tables removed
- [ ] Restore from backup if needed
- [ ] Notify team of rollback
- [ ] Schedule post-mortem

## Sign-Off

### Deployment Approval
- [ ] Tested in staging/development
- [ ] All tests passed
- [ ] Documentation reviewed
- [ ] Rollback plan understood

**Deployed by:** `_________________`
**Date:** `_________________`
**Time:** `_________________`
**Environment:** Development / Staging / Production

### Post-Deployment Approval
- [ ] Monitoring shows no errors
- [ ] Points awarding correctly
- [ ] No user complaints
- [ ] Ready for next phase (UI development)

**Verified by:** `_________________`
**Date:** `_________________`

## Next Phase Planning

### UI Development (Phase 2)
- [ ] Scheduled start date: `_________________`
- [ ] Assigned to: `_________________`
- [ ] Tasks:
  - [ ] Add points display in customer profile
  - [ ] Show points on receipt page
  - [ ] Update WhatsApp template with balance
  - [ ] Add error handling and user feedback

### Redemption System (Phase 3)
- [ ] Scheduled start date: `_________________`
- [ ] Assigned to: `_________________`
- [ ] Tasks:
  - [ ] Design redemption flow
  - [ ] Implement redemption logic
  - [ ] Create admin dashboard
  - [ ] Add redemption testing

## Resources

### Quick Links
- **Deployment Guide:** `POINTS_DEPLOYMENT_GUIDE.md`
- **Quick Reference:** `POINTS_QUICK_REFERENCE.md`
- **Fix Summary:** `POINTS_TABLES_FIX_SUMMARY.md`
- **System Overview:** `POINTS_SYSTEM_README.md`

### Support Contacts
- **Technical Lead:** `_________________`
- **Database Admin:** `_________________`
- **DevOps:** `_________________`

### Verification Queries

**Check if deployment was successful:**
```sql
-- All should return expected results
SELECT COUNT(*) FROM pg_tables
WHERE tablename IN ('points', 'point_transactions');  -- Should be 2

SELECT COUNT(*) FROM pg_proc
WHERE proname = 'calculate_order_points';  -- Should be 1

SELECT COUNT(*) FROM information_schema.columns
WHERE table_name = 'points'
AND column_name IN ('customer_phone', 'store_id');  -- Should be 2
```

**Check if system is working:**
```sql
-- Points awarded today
SELECT COUNT(*), SUM(points_earned)
FROM orders
WHERE created_at >= CURRENT_DATE
AND payment_status = 'paid'
AND points_earned > 0;

-- Recent transactions
SELECT *
FROM point_transactions
ORDER BY transaction_date DESC
LIMIT 10;
```

## Notes

Use this section to document any issues, deviations, or important observations during deployment:

```
Date: _______________
Note: _________________________________________________________
______________________________________________________________
______________________________________________________________

Date: _______________
Note: _________________________________________________________
______________________________________________________________
______________________________________________________________

Date: _______________
Note: _________________________________________________________
______________________________________________________________
______________________________________________________________
```

---

**Deployment Status:** ⬜ Not Started / ⬜ In Progress / ⬜ Completed / ⬜ Rolled Back
**Last Updated:** `_________________`
