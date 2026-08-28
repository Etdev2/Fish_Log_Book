
### 2026-08-28 | architect -> ux-ui
Blank trips need an end-of-trip prompt, not just a stop button. The model stores
`zero_catch_confirmed_at` and `catch_log_confidence` (complete / partial / unknown), and
only `complete` trips count toward a catch rate. Without that prompt, "caught nothing"
and "gave up logging" are the same record and D2's denominator is quietly wrong. Also:
water temp and current direction are the only two fields the app must ask for with an
empty box — everything else is either automatic or a tap on a list.

