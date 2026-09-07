# Support data-request runbook

Use this procedure only after a request reaches `wqy1994yeah@gmail.com` from the email address used for the account.

1. Verify the requester controls that signed-in account email. Do not export or delete data based only on a name, pet name, or forwarded message.
2. For an export, use the Supabase service-role access to collect only rows whose `user_id` equals the verified Auth user ID from `pet_profiles`, `pet_concerns`, `pet_tasks`, `concern_actions`, `pet_milestones`, `pet_check_ins`, `product_events`, and `purchases`. Include the Auth account email. Send the resulting structured copy only to the verified account email.
3. For deletion, obtain approval after identity verification, then delete that user in Supabase Auth using the verified Auth user ID. The database foreign keys use `on delete cascade`, which removes the associated application rows.
4. Confirm that the user asked about application data. Do not claim to delete Creem-held payment records; payment-provider records are handled separately by Creem.

This is an operator procedure, not a self-service product feature. It intentionally sets no completion-time promise.
