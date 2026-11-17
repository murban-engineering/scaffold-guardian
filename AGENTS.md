# Architecture rules
- Add Scaffold page Add/Deduct actions use dedicated identity-checked database functions and the server-verified permission hook; unrelated CRUD and delivery/return functions remain unchanged to keep the restriction scoped to the requested page.
- Continue Quotation draft eligibility is centralized in a tested status helper so delete actions stay limited to drafts.
- Quotation equipment quantities are independent of current stock; enforce stock availability only in the dispatch workflow so clients can quote requested demand.