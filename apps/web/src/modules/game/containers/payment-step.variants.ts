/** Class bundles for the paid-analysis payment step. */
export const paymentTitleClass = 'text-lg font-bold text-foreground';

export const paymentDescriptionClass = 'text-sm text-muted-foreground';

/** Row holding the spinner + "loading" copy while the SDK renders the buttons. */
export const paymentLoaderClass = 'flex items-center gap-2 py-2';

/**
 * The PayPal SDK renders its buttons in an iframe and follows the page's
 * `prefers-color-scheme`, so on our dark theme it paints a dark "Debit or
 * Credit Card" button with dark, unreadable text. Forcing `color-scheme: light`
 * on the mount makes the embedded iframe render its LIGHT button variant (black
 * button, white text), and the white background keeps everything on the surface
 * PayPal designs for. `empty:hidden` avoids a white strip while the SDK loads.
 */
export const paymentButtonsClass = 'rounded-xl bg-white p-3 [color-scheme:light] empty:hidden';
