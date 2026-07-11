/**
 * Icon facade: the single place the app depends on `lucide-react`. Icons are
 * re-exported with an explicit `*Icon` suffix and restricted to the allowlist
 * a photo-matching game plausibly needs, so swapping the underlying icon set
 * later touches only this file.
 */

export {
  ChevronDown as ChevronDownIcon,
  Globe as GlobeIcon,
  Heart as HeartIcon,
  House as HomeIcon,
  Moon as MoonIcon,
  Sparkles as SparklesIcon,
  Sun as SunIcon,
} from 'lucide-react';
