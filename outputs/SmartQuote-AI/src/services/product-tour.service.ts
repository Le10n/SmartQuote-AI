export const productTourCompletedKey = "smartquote-product-tour-completed-v1";
export const productTourProgressKey = "smartquote-product-tour-progress-v1";
export const productTourRestartEvent = "smartquote:restart-product-tour";

export function readProductTourCompleted() {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(productTourCompletedKey) === "true";
}

export function readProductTourProgress() {
  if (typeof window === "undefined") return 0;
  const stored = Number(window.localStorage.getItem(productTourProgressKey));
  return Number.isFinite(stored) && stored >= 0 ? stored : 0;
}

export function saveProductTourProgress(stepIndex: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(productTourProgressKey, String(stepIndex));
}

export function completeProductTour() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(productTourCompletedKey, "true");
  window.localStorage.removeItem(productTourProgressKey);
}

export function restartProductTour() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(productTourCompletedKey);
  window.localStorage.removeItem(productTourProgressKey);
  window.dispatchEvent(new CustomEvent(productTourRestartEvent));
}
