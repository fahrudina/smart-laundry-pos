# Add Cash Payment Flow with Change Calculation to POS System

## Objective
Enhance the payment process in the Smart Laundry POS system by adding a cash payment flow that:
1. Allows staff to input the cash amount received from customer
2. Calculates and displays the change (difference between received amount and total)
3. Stores this information in the database
4. Shows the cash received and change given on the receipt

## Current Implementation
The system currently processes payments with:
- Payment methods (cash, QRIS, etc.) in `src/components/pos/LaundryPOSWithWhatsApp.tsx` and other POS components
- Payment information saved to database in the `orders` table
- Receipt display in `src/pages/PublicReceiptPage.tsx`

## Technical Requirements

### 1. Database Changes
- Add `cash_received` field to the `orders` table (numeric/decimal type)
- The difference (change) can be calculated at runtime (cash_received - total_amount)

### 2. Payment Flow UI Modifications
- When user selects "cash" as payment method, show an additional input field for "Cash Received"
- Add a dialog or modal that:
  - Shows the total amount to be paid
  - Has an input field for the amount received (defaulting to the exact amount)
  - Displays the calculated change in real-time as the input changes
  - Has "Confirm" and "Cancel" buttons

### 3. Payment Processing Logic
- Update the `processPayment` function to include the cash received amount
- Modify the order data structure to include the new field:
```typescript
const orderData = {
  // ...existing fields
  payment_method: 'cash',
  payment_amount: totalAmount,
  cash_received: cashReceivedAmount, // New field
};
```

### 4. Receipt Display Update
- Update `PublicReceiptPage.tsx` to show:
  - Cash received amount
  - Change given
  - Only display these fields when payment_method is "cash"

## UI/UX Guidelines
- Make the cash input field prominent and easy to use
- Show the change amount in a highlighted format
- Validate that cash received is greater than or equal to the total amount
- Consider adding quick-select buttons for common cash denominations (e.g. 50k, 100k IDR)

## Implementation Notes
- Ensure all calculations handle currency properly (avoid floating point errors)
- The change calculation must be consistent between UI, server, and receipt
- Consider adding client-side validation to ensure cash received ≥ total amount

Please implement this feature maintaining the existing code style and patterns.