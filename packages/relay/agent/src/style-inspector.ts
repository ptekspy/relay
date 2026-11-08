/**
 * Computed CSS Style Inspector & Box Model Visualizer
 *
 * Inspects computed CSS properties, inline styles, and box model metrics (margin,
 * border, padding, content box) for any target element, and enables live style editing.
 *
 * Note for Octavia: This powers the Styles and Box Model panes in Cloud Web DevTools.
 */

export interface BoxModelMetrics {
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  border: { top: number; right: number; bottom: number; left: number };
  padding: { top: number; right: number; bottom: number; left: number };
}

export interface ComputedStylesSnapshot {
  computed: Record<string, string>;
  inlineStyles: Record<string, string>;
  boxModel: BoxModelMetrics;
}

export interface InspectableElement {
  nodeType: number;
  nodeName: string;
  style?: {
    length: number;
    [index: number]: string;
    getPropertyValue: (prop: string) => string;
    setProperty: (prop: string, val: string, priority?: string) => void;
    removeProperty: (prop: string) => string;
  };
  getBoundingClientRect?: () => { width: number; height: number };
}

export class StyleInspectorManager {
  private static parsePixels(val: string | undefined): number {
    if (!val) return 0;
    const parsed = Number.parseFloat(val);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  public inspectElement(
    element: InspectableElement,
    computedGetter: (
      el: InspectableElement,
    ) => Record<string, string> = StyleInspectorManager.defaultComputedGetter,
  ): ComputedStylesSnapshot {
    const computed = computedGetter(element);
    const inlineStyles: Record<string, string> = {};

    if (element.style) {
      for (let i = 0; i < element.style.length; i++) {
        const prop = element.style[i];
        if (prop) {
          inlineStyles[prop] = element.style.getPropertyValue(prop);
        }
      }
    }

    const rect = element.getBoundingClientRect
      ? element.getBoundingClientRect()
      : { width: 0, height: 0 };
    const width =
      StyleInspectorManager.parsePixels(computed.width) || rect.width;
    const height =
      StyleInspectorManager.parsePixels(computed.height) || rect.height;

    const boxModel: BoxModelMetrics = {
      width: Math.round(width),
      height: Math.round(height),
      margin: {
        top: StyleInspectorManager.parsePixels(computed["margin-top"]),
        right: StyleInspectorManager.parsePixels(computed["margin-right"]),
        bottom: StyleInspectorManager.parsePixels(computed["margin-bottom"]),
        left: StyleInspectorManager.parsePixels(computed["margin-left"]),
      },
      border: {
        top: StyleInspectorManager.parsePixels(computed["border-top-width"]),
        right: StyleInspectorManager.parsePixels(
          computed["border-right-width"],
        ),
        bottom: StyleInspectorManager.parsePixels(
          computed["border-bottom-width"],
        ),
        left: StyleInspectorManager.parsePixels(computed["border-left-width"]),
      },
      padding: {
        top: StyleInspectorManager.parsePixels(computed["padding-top"]),
        right: StyleInspectorManager.parsePixels(computed["padding-right"]),
        bottom: StyleInspectorManager.parsePixels(computed["padding-bottom"]),
        left: StyleInspectorManager.parsePixels(computed["padding-left"]),
      },
    };

    return {
      computed,
      inlineStyles,
      boxModel,
    };
  }

  public updateElementStyle(
    element: InspectableElement,
    property: string,
    value: string,
  ): boolean {
    if (!element.style || typeof element.style.setProperty !== "function") {
      return false;
    }
    element.style.setProperty(property, value);
    return true;
  }

  public removeElementStyle(
    element: InspectableElement,
    property: string,
  ): boolean {
    if (!element.style || typeof element.style.removeProperty !== "function") {
      return false;
    }
    element.style.removeProperty(property);
    return true;
  }

  private static defaultComputedGetter(
    el: InspectableElement,
  ): Record<string, string> {
    if (
      typeof window !== "undefined" &&
      typeof window.getComputedStyle === "function"
    ) {
      const style = window.getComputedStyle(el as unknown as Element);
      const result: Record<string, string> = {};
      for (let i = 0; i < style.length; i++) {
        const prop = style[i];
        if (prop) {
          result[prop] = style.getPropertyValue(prop);
        }
      }
      return result;
    }
    return {};
  }
}
