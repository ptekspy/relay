/**
 * Remote Form Auto-Fill & Synthetic Input Injector
 *
 * Dispatches synthetic text input into focused or targeted input elements on mobile receivers,
 * bypassing React controlled input tracker overrides and triggering bubbling input and change events.
 *
 * Note for Octavia: Uses HTMLInputElement.prototype native setter to guarantee React state updates.
 */

export interface FormInjectionRequest {
  selector?: string;
  value: string;
  clearFirst?: boolean;
  submitOnEnter?: boolean;
}

export interface FormInjectionResult {
  success: boolean;
  targetFound: boolean;
  previousValue: string;
  newValue: string;
  error?: string;
}

export interface SyntheticInputElement {
  tagName: string;
  value: string;
  dispatchEvent: (event: unknown) => boolean;
  form?: {
    requestSubmit?: () => void;
    submit?: () => void;
    dispatchEvent?: (event: unknown) => boolean;
  };
}

export interface FormInjectorDocument {
  activeElement?: SyntheticInputElement | null;
  querySelector?: (selector: string) => SyntheticInputElement | null;
}

export class SyntheticFormInjector {
  public static inject(
    request: FormInjectionRequest,
    doc: FormInjectorDocument = typeof document !== "undefined"
      ? (document as unknown as FormInjectorDocument)
      : {},
  ): FormInjectionResult {
    let target: SyntheticInputElement | null = null;

    if (request.selector && doc.querySelector) {
      target = doc.querySelector(request.selector);
    }

    if (!target && doc.activeElement) {
      target = doc.activeElement;
    }

    if (!target) {
      return {
        success: false,
        targetFound: false,
        previousValue: "",
        newValue: "",
        error: "No active or targeted input element found",
      };
    }

    const previousValue = target.value || "";
    const newValue = request.clearFirst
      ? request.value
      : previousValue + request.value;

    try {
      // Use native value setter to ensure React controlled inputs detect the change
      SyntheticFormInjector.setNativeValue(target, newValue);

      // Dispatch 'input' event
      const inputEvent =
        typeof Event !== "undefined"
          ? new Event("input", { bubbles: true, cancelable: true })
          : { type: "input", bubbles: true };
      target.dispatchEvent(inputEvent);

      // Dispatch 'change' event
      const changeEvent =
        typeof Event !== "undefined"
          ? new Event("change", { bubbles: true, cancelable: true })
          : { type: "change", bubbles: true };
      target.dispatchEvent(changeEvent);

      // Optional form submission if Enter was triggered
      if (request.submitOnEnter && target.form) {
        if (typeof target.form.requestSubmit === "function") {
          target.form.requestSubmit();
        } else if (typeof target.form.submit === "function") {
          target.form.submit();
        }
      }

      return {
        success: true,
        targetFound: true,
        previousValue,
        newValue,
      };
    } catch (err) {
      return {
        success: false,
        targetFound: true,
        previousValue,
        newValue: target.value,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  private static setNativeValue(
    element: SyntheticInputElement,
    value: string,
  ): void {
    if (
      typeof window !== "undefined" &&
      typeof HTMLInputElement !== "undefined"
    ) {
      const isTextArea = element.tagName?.toLowerCase() === "textarea";
      const proto = isTextArea
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
      const descriptor = Object.getOwnPropertyDescriptor(proto, "value");

      if (descriptor && descriptor.set) {
        descriptor.set.call(element, value);
        return;
      }
    }

    element.value = value;
  }
}
