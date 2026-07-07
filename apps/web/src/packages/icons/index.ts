/**
 * Icon facade: the single place the app depends on `lucide-react`. Icons are
 * re-exported with an explicit `*Icon` suffix and restricted to the allowlist
 * a photo-matching game plausibly needs, so swapping the underlying icon set
 * later touches only this file.
 */

export type { LucideIcon as AppIcon } from 'lucide-react';
export {
  AlertTriangle as AlertIcon,
  ArrowLeft as ArrowLeftIcon,
  Check as CheckIcon,
  ChevronDown as ChevronDownIcon,
  X as CloseIcon,
  Globe as GlobeIcon,
  House as HomeIcon,
  Image as ImageIcon,
  Info as InfoIcon,
  Loader2 as LoaderIcon,
  Moon as MoonIcon,
  RotateCcw as RefreshIcon,
  Share as ShareIcon,
  Sparkles as SparklesIcon,
  Sun as SunIcon,
  Upload as UploadIcon,
  X as XIcon,
} from 'lucide-react';
