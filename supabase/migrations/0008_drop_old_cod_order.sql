-- 0008_drop_old_cod_order.sql
--
-- Cleanup step for the zero-downtime rollout in 0007. Apply this ONLY AFTER the
-- app code that calls the 9-parameter create_cod_order() (… , p_governorate) is
-- live in production — otherwise the currently-deployed 8-parameter callers break.
--
-- The 8-param overload still charged VAT and added no shipping; nothing should
-- call it once the new code ships.
--
-- Rollback: re-create the 8-param body from 0005_cod_order_qty_and_stock_limits.sql.

drop function if exists public.create_cod_order(
  text, text, text, text, text, text, text, jsonb
);
