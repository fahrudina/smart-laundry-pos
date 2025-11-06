# Points System Documentation

## 📚 Overview

The customer loyalty points system rewards customers with points for each paid order. This folder contains all documentation and scripts needed to deploy, verify, and maintain the points system.

## 🚀 Quick Start

### For First-Time Deployment

1. **Read the deployment guide** first:
   ```
   📄 POINTS_DEPLOYMENT_GUIDE.md
   ```

2. **Apply migrations in order**:
   - First: `supabase/migrations/20251031000000_create_base_points_tables.sql`
   - Then: `supabase/migrations/20251101000000_create_customer_points_system.sql`

3. **Verify installation**:
   ```sql
   -- Run this script in Supabase SQL Editor
   script/verify-points-tables.sql
   ```

4. **Test with sample data** (optional):
   ```sql
   script/seed-test-points-data.sql
   ```

### For Troubleshooting

1. **Quick reference for common tasks**:
   ```
   📄 POINTS_QUICK_REFERENCE.md
   ```

2. **Understanding what was fixed**:
   ```
   📄 POINTS_TABLES_FIX_SUMMARY.md
   ```

## 📖 Documentation Index

### Primary Documents

| Document | Purpose | Audience |
|----------|---------|----------|
| **POINTS_DEPLOYMENT_GUIDE.md** | Step-by-step deployment instructions | DevOps, Developers |
| **POINTS_QUICK_REFERENCE.md** | Code examples and SQL queries | Developers, Support |
| **POINTS_TABLES_FIX_SUMMARY.md** | Explanation of critical fix | Technical leads |
| **LAUNDRY_POINTS_IMPLEMENTATION.md** | Original implementation docs | All |

### Migration Files

| File | Purpose | Timestamp |
|------|---------|-----------|
| `20251031000000_create_base_points_tables.sql` | Creates base tables | Oct 31, 2025 |
| `20251101000000_create_customer_points_system.sql` | Adds multi-tenant support | Nov 1, 2025 |
| `ROLLBACK_20251031000000_*.sql` | Emergency rollback | N/A |

### Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `verify-points-tables.sql` | Comprehensive verification | Run after deployment |
| `seed-test-points-data.sql` | Generate test data | Development only |

## 🎯 Quick Reference

### How Points Work

**Earning Rules:**
- 1 point per kilogram (rounded) for weight-based services
- 1 point per unit for count-based services
- Both weight + unit points for combined services
- Only awarded when payment status is "paid"

**Example:**
```
Order: 2.3 kg laundry + 3 shoes
Points: round(2.3) + 3 = 2 + 3 = 5 points
```

### Key Code Locations

```
Application logic:  src/hooks/useOrdersWithNotifications.ts:66-145
Database function:  supabase/migrations/20251101000000_*.sql:58-92
WhatsApp template:  src/integrations/whatsapp/templates.ts:72-74
```

### Common SQL Queries

**Check customer points:**
```sql
SELECT customer_phone, current_points, accumulated_points
FROM points
WHERE customer_phone = '08123456789'
  AND store_id = 'your-store-uuid';
```

**View transaction history:**
```sql
SELECT pt.*, p.customer_phone
FROM point_transactions pt
JOIN points p ON p.point_id = pt.point_id
WHERE p.customer_phone = '08123456789'
ORDER BY pt.transaction_date DESC;
```

**Calculate points for order:**
```sql
SELECT calculate_order_points('order-uuid-here');
```

## ⚠️ Known Limitations

Current implementation has these limitations:

1. **No UI for viewing points** - Customers can't see their balance in app
2. **No redemption system** - Points can be earned but not used
3. **No error handling** - Point awarding failures are silent
4. **Empty TypeScript types** - No type safety for points operations
5. **WhatsApp only** - Points only visible in WhatsApp notifications

See **POINTS_TABLES_FIX_SUMMARY.md** for full list and recommendations.

## 🔧 Troubleshooting

### Common Issues

**Issue: "Table 'points' doesn't exist"**
- **Solution:** Run base migration `20251031000000_create_base_points_tables.sql`

**Issue: "Column 'customer_phone' doesn't exist"**
- **Solution:** Run enhancement migration `20251101000000_create_customer_points_system.sql`

**Issue: "Points not awarded to customer"**
- **Check:** Payment status must be 'paid' (not 'pending')
- **Check:** `useCreateOrderWithNotifications` hook is being used
- **Check:** Browser console for errors

**Issue: "calculate_order_points function not found"**
- **Solution:** Run enhancement migration (contains function definition)

For more troubleshooting, see **POINTS_QUICK_REFERENCE.md** → Troubleshooting section.

## 📊 Verification Checklist

After deployment, verify these items:

- [ ] Both tables exist (`points`, `point_transactions`)
- [ ] All required columns present (run verify script)
- [ ] `calculate_order_points()` function exists
- [ ] Indexes created on key columns
- [ ] RLS policies enabled
- [ ] Test order awards points correctly
- [ ] Transaction recorded in `point_transactions`
- [ ] WhatsApp notification includes points

Run `script/verify-points-tables.sql` to check all items automatically.

## 🚦 Deployment Status

### Production Readiness: ⚠️ PARTIAL

**Database Layer:** ✅ Ready
- Tables created with proper structure
- Multi-tenant isolation configured
- Performance indexes in place
- Audit trail via transactions table

**Application Layer:** ✅ Ready
- Point calculation logic implemented
- Automatic awarding on payment
- WhatsApp notification integration
- Per-store point tracking

**User Experience:** ❌ Incomplete
- No UI to view point balance
- No redemption functionality
- No admin dashboard
- Limited to WhatsApp visibility

### Recommended Next Steps

**Phase 1: Critical (Deploy Now)**
1. ✅ Deploy base migration → **DONE**
2. ✅ Deploy enhancement migration → **DONE**
3. ⬜ Verify in production
4. ⬜ Monitor for errors

**Phase 2: User Experience (Next Sprint)**
1. ⬜ Add points display in customer profile
2. ⬜ Show points on receipt page
3. ⬜ Include balance in WhatsApp notifications
4. ⬜ Add error handling with user feedback

**Phase 3: Complete Feature (Future)**
1. ⬜ Implement point redemption system
2. ⬜ Create admin dashboard for owners
3. ⬜ Add point expiration policy
4. ⬜ Enable manual point adjustments

## 📞 Support

### Getting Help

1. **Check documentation:**
   - Quick answers: `POINTS_QUICK_REFERENCE.md`
   - Deployment issues: `POINTS_DEPLOYMENT_GUIDE.md`
   - Understanding fix: `POINTS_TABLES_FIX_SUMMARY.md`

2. **Run diagnostics:**
   ```sql
   -- Copy and run in Supabase SQL Editor
   script/verify-points-tables.sql
   ```

3. **Check application logs:**
   - Browser console (F12 → Console)
   - Look for "points" or "point_transactions" errors
   - Check Supabase logs in Dashboard

4. **Review code:**
   - Point awarding: `src/hooks/useOrdersWithNotifications.ts:66-145`
   - Calculation function: See enhancement migration
   - WhatsApp template: `src/integrations/whatsapp/templates.ts:72-74`

### Emergency Rollback

If points system causes critical issues:

1. **Backup data first:**
   ```sql
   SELECT * FROM points;        -- Export to CSV
   SELECT * FROM point_transactions;  -- Export to CSV
   ```

2. **Run rollback migration:**
   ```sql
   -- Copy contents of:
   supabase/migrations/ROLLBACK_20251031000000_create_base_points_tables.sql
   ```

3. **Remove feature flag** (if implemented):
   ```bash
   VITE_POINTS_ENABLED=false
   ```

## 📈 Monitoring

### Key Metrics to Track

**Daily:**
- Total points issued: `SELECT SUM(points_changed) FROM point_transactions WHERE transaction_type='earning' AND transaction_date >= CURRENT_DATE`
- New customers with points: `SELECT COUNT(*) FROM points WHERE created_at >= CURRENT_DATE`
- Failed point awards: Check application error logs

**Weekly:**
- Top customers: `SELECT customer_phone, accumulated_points FROM points ORDER BY accumulated_points DESC LIMIT 10`
- Average points per customer: `SELECT AVG(accumulated_points) FROM points`
- Total point liability: `SELECT SUM(current_points) FROM points`

**Monthly:**
- Engagement rate: % of orders that award points
- Redemption rate: (when implemented)
- Customer retention by points tier

## 🎓 Learning Resources

### Understanding the System

1. **Start here:** `LAUNDRY_POINTS_IMPLEMENTATION.md`
2. **Architecture:** `CLAUDE.md` → Points System section
3. **Code deep-dive:** `src/hooks/useOrdersWithNotifications.ts`
4. **Database schema:** `supabase/migrations/20251031000000_*.sql`

### SQL Examples

All common queries are in `POINTS_QUICK_REFERENCE.md`:
- Checking customer points
- Viewing transaction history
- Manual adjustments
- Reporting queries
- Troubleshooting queries

## 🔄 Updates and Maintenance

### Regular Maintenance Tasks

**Weekly:**
- Check for orphaned transactions
- Verify RLS policies are active
- Review error logs for point awarding failures

**Monthly:**
- Analyze point distribution
- Review and optimize indexes
- Check for data integrity issues
- Update documentation if needed

**As Needed:**
- Manual point adjustments for customer service
- Bulk updates for promotions
- Data exports for marketing

## ✅ Summary

The points system is **production-ready at the database level** but needs UI development for complete customer experience. The base tables now exist with proper structure, making the feature functional for earning points.

**Current Status:**
- ✅ Points are earned automatically on paid orders
- ✅ Points are stored securely per customer per store
- ✅ Full audit trail in transaction history
- ✅ WhatsApp notifications include points
- ⚠️ No UI for customers to view balance
- ⚠️ No redemption system yet

**Recommended Action:**
Deploy database migrations now, plan UI development for next sprint.

---

**Last Updated:** November 2, 2025
**Version:** 1.0
**Status:** Production Ready (Database Layer)
