import { describe, expect, it } from "bun:test";
import {
  type FormInjectorDocument,
  SyntheticFormInjector,
  type SyntheticInputElement,
} from "../src/form-injector.js";

describe("TASK-139: Remote Form Auto-Fill & Synthetic Input Injector", () => {
  const createMockInputElement = (
    initialValue = "",
  ): {
    el: SyntheticInputElement;
    events: string[];
    submitted: boolean;
  } => {
    const events: string[] = [];
    let submitted = false;

    const el: SyntheticInputElement = {
      tagName: "INPUT",
      value: initialValue,
      dispatchEvent: (evt: unknown) => {
        events.push((evt as { type: string }).type);
        return true;
      },
      form: {
        requestSubmit: () => {
          submitted = true;
        },
      },
    };

    return {
      el,
      events,
      get submitted() {
        return submitted;
      },
    };
  };

  it("injects value by selector and triggers input and change events", () => {
    const mockInput = createMockInputElement("hello ");
    const doc: FormInjectorDocument = {
      querySelector: (sel: string) =>
        sel === "#username" ? mockInput.el : null,
    };

    const res = SyntheticFormInjector.inject(
      { selector: "#username", value: "world" },
      doc,
    );

    expect(res.success).toBe(true);
    expect(res.previousValue).toBe("hello ");
    expect(res.newValue).toBe("hello world");
    expect(mockInput.el.value).toBe("hello world");
    expect(mockInput.events).toContain("input");
    expect(mockInput.events).toContain("change");
  });

  it("clears previous value when clearFirst is enabled", () => {
    const mockInput = createMockInputElement("old_text");
    const doc: FormInjectorDocument = {
      activeElement: mockInput.el,
    };

    const res = SyntheticFormInjector.inject(
      { value: "fresh_text", clearFirst: true },
      doc,
    );

    expect(res.success).toBe(true);
    expect(res.previousValue).toBe("old_text");
    expect(res.newValue).toBe("fresh_text");
    expect(mockInput.el.value).toBe("fresh_text");
  });

  it("submits form when submitOnEnter is requested", () => {
    const mockInput = createMockInputElement("");
    const doc: FormInjectorDocument = {
      activeElement: mockInput.el,
    };

    const res = SyntheticFormInjector.inject(
      { value: "search query", submitOnEnter: true },
      doc,
    );

    expect(res.success).toBe(true);
    expect(mockInput.submitted).toBe(true);
  });

  it("returns error when no active or targeted element is found", () => {
    const doc: FormInjectorDocument = {
      activeElement: null,
      querySelector: () => null,
    };

    const res = SyntheticFormInjector.inject(
      { selector: "#nonexistent", value: "test" },
      doc,
    );
    expect(res.success).toBe(false);
    expect(res.targetFound).toBe(false);
  });
});
