# Deployment Checklist

## 🚀 Pre-Deployment Checklist

Before deploying to Vercel, make sure these items are completed:

### ✅ Loyalty Points Feature
- [ ] Apply database migration: `20251107000000_fix_get_user_stores_add_enable_points.sql`
- [ ] Verify migration in Supabase SQL Editor
- [ ] Enable points in Store Settings after deployment
- [ ] Test points awarding with a paid order

### ✅ Vercel Analytics & Speed Insights
- [x] Installed `@vercel/analytics` package
- [x] Installed `@vercel/speed-insights` package
- [x] Integrated into [src/main.tsx](src/main.tsx)
- [x] Build verified successfully
- [x] Dev server tested successfully

### 📋 Database Migrations to Apply

Run these in Supabase SQL Editor in order:

1. **Points Base Tables** (if not applied):
   ```
   supabase/migrations/20251031000000_create_base_points_tables.sql
   ```

2. **Customer Points System** (if not applied):
   ```
   supabase/migrations/20251101000000_create_customer_points_system.sql
   ```

3. **Enable Points in Stores** (if not applied):
   ```
   supabase/migrations/20251102000000_add_enable_points_to_stores.sql
   ```

4. **Fix get_user_stores Function** (REQUIRED):
   ```
   supabase/migrations/20251107000000_fix_get_user_stores_add_enable_points.sql
   ```

### 🔧 Environment Variables (Vercel)

Make sure these are set in Vercel project settings:

**Supabase**:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon/public key

**WhatsApp (Optional)**:
- `VITE_WHATSAPP_ENABLED` - Set to `true` if using WhatsApp
- `VITE_WHATSAPP_API_URL` - Your WhatsApp API endpoint
- `VITE_WHATSAPP_NOTIFY_ORDER_CREATED` - `true` or `false`
- `VITE_WHATSAPP_NOTIFY_ORDER_COMPLETED` - `true` or `false`

**Analytics** (No setup needed):
- ✅ Vercel Analytics - Auto-configured
- ✅ Speed Insights - Auto-configured

## 📦 Deployment Steps

### Step 1: Commit Changes
```bash
git add .
git commit -m "Add Vercel Analytics, Speed Insights, and fix loyalty points"
git push origin main
```

### Step 2: Vercel Auto-Deploy
- Vercel will automatically detect the push
- Wait for build to complete (~1-2 minutes)
- Check deployment logs for any errors

### Step 3: Apply Database Migrations
1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Run migration: `20251107000000_fix_get_user_stores_add_enable_points.sql`
4. Verify success message

### Step 4: Enable Points Feature
1. Login to deployed app as store owner
2. Go to Store Management → Store Settings
3. Toggle "Enable Points Rewards" to ON
4. Click Save Settings

### Step 5: Verify Everything Works
- [ ] App loads correctly
- [ ] Login works
- [ ] Create a test order with payment = "paid"
- [ ] Check customer points are awarded
- [ ] Verify points display in UI
- [ ] Check Vercel Analytics dashboard (after 5-10 min)

## 🎯 Post-Deployment Verification

### Test Loyalty Points
1. **Create Paid Order**:
   ```
   Customer: Test Customer (phone: 081234567890)
   Service: 5kg Laundry
   Payment Status: Paid
   ```

2. **Verify Points Awarded**:
   - Go to Customers page
   - Find customer 081234567890
   - Should see 5 points earned

3. **Check Database** (Supabase SQL Editor):
   ```sql
   SELECT * FROM points WHERE customer_phone = '081234567890';
   ```

### Test Analytics
1. **Generate Some Traffic**:
   - Visit different pages (POS, Orders, Customers)
   - Create a few orders
   - Navigate around the app

2. **Check Analytics Dashboard**:
   - Go to Vercel project → Analytics tab
   - Should see page views within 5-10 minutes
   - Geographic data may take longer

3. **Check Speed Insights**:
   - Go to Vercel project → Speed Insights tab
   - Data appears within 24 hours
   - Visit from different devices for better data

## 🐛 Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild locally
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Migration Errors
```sql
-- Check if migration already applied
SELECT * FROM get_user_stores_by_userid('your-user-id');
-- Should return enable_points and enable_qr columns
```

### Points Not Working
1. Check migration was applied
2. Verify `enable_points = true` in stores table
3. Ensure payment_status = 'paid' on orders
4. Check browser console for errors

### Analytics Not Showing
- Wait 5-10 minutes after deployment
- Ensure using Vercel deployment (not localhost)
- Check Vercel project has Analytics enabled

## 📊 Monitoring

### Daily
- Check for any errors in Vercel logs
- Monitor app performance in Speed Insights
- Verify orders are being created successfully

### Weekly
- Review Analytics for usage patterns
- Check Speed Insights for performance trends
- Review customer feedback

### Monthly
- Analyze most-used features
- Optimize slow pages based on Speed Insights
- Review and act on analytics insights

## 🎉 Success Criteria

Your deployment is successful when:

- [x] App builds without errors
- [x] All pages load correctly
- [ ] Login/authentication works
- [ ] Orders can be created
- [ ] Payments are processed
- [ ] Points are awarded on paid orders
- [ ] Points display in customer profiles
- [ ] Analytics shows data in Vercel dashboard
- [ ] Speed Insights collects performance metrics
- [ ] No errors in browser console
- [ ] No errors in Vercel logs

## 📚 Documentation Reference

- [VERCEL_ANALYTICS_SETUP.md](VERCEL_ANALYTICS_SETUP.md) - Analytics setup guide
- [POINTS_FEATURE_FIX.md](POINTS_FEATURE_FIX.md) - Points fix documentation
- [POINTS_QUICK_START.md](POINTS_QUICK_START.md) - Points quick start guide
- [CLAUDE.md](CLAUDE.md) - Full project documentation

## 🆘 Support

If issues persist:
1. Check Vercel deployment logs
2. Check Supabase logs
3. Review browser console errors
4. Verify all migrations applied correctly
5. Ensure environment variables are set

---

**Next Steps**: Commit changes and push to trigger deployment!
