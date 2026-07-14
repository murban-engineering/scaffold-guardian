-- Repair stale return_balance_quantity for dispatched quotations where
-- nothing has been returned yet but the balance was written as 0,
-- which blocked users from processing new returns.
UPDATE public.quotation_line_items li
SET return_balance_quantity = GREATEST(COALESCE(li.delivered_quantity, li.quantity, 0) - COALESCE(li.returned_quantity, 0), 0)
FROM public.hire_quotations q
WHERE li.quotation_id = q.id
  AND q.status = 'dispatched'
  AND COALESCE(li.returned_quantity, 0) = 0
  AND COALESCE(li.return_balance_quantity, 0) = 0
  AND COALESCE(li.delivered_quantity, li.quantity, 0) > 0;