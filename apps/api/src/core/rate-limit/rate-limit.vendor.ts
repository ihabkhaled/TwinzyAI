/**
 * Single swap surface for the rate-limiting vendor decorator. Controllers
 * import Throttle from core/rate-limit — never the vendor package directly.
 */
export { Throttle } from '@nestjs/throttler';
