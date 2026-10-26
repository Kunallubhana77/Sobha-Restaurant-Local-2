import { describe, expect, it } from "vitest";
import { validateOrderInput } from "./orderBackend";

describe("demo order validation", () => {
  const baseOrder = {
    demoCode: "classroom-demo-code",
    customerName: "Asha Demo",
    deliveryAddress: "12 Sample Road, Mumbai",
    items: [{ id: "paneer-tikka", quantity: 2 }],
  };

  it("derives line prices and totals from the shared demo catalog", () => {
    const result = validateOrderInput(baseOrder);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.totalRupees).toBe(640);
      expect(result.value.items[0]).toMatchObject({
        id: "paneer-tikka",
        name: "Charred paneer tikka",
        unitPriceRupees: 320,
        quantity: 2,
        lineTotalRupees: 640,
      });
    }
  });

  it("rejects any client-supplied price or recipient field", () => {
    expect(
      validateOrderInput({ ...baseOrder, recipientPhone: "+919876543210" }).ok
    ).toBe(false);
    expect(
      validateOrderInput({
        ...baseOrder,
        items: [{ id: "paneer-tikka", quantity: 2, priceRupees: 1 }],
      }).ok
    ).toBe(false);
  });

  it("rejects unknown catalog IDs, duplicate items, and invalid quantities", () => {
    expect(
      validateOrderInput({
        ...baseOrder,
        items: [{ id: "custom", quantity: 1 }],
      }).ok
    ).toBe(false);
    expect(
      validateOrderInput({
        ...baseOrder,
        items: [baseOrder.items[0], baseOrder.items[0]],
      }).ok
    ).toBe(false);
    expect(
      validateOrderInput({
        ...baseOrder,
        items: [{ id: "paneer-tikka", quantity: 1.5 }],
      }).ok
    ).toBe(false);
  });

  it("rejects excessive or malformed customer fields", () => {
    expect(validateOrderInput({ ...baseOrder, customerName: "   " }).ok).toBe(
      false
    );
    expect(validateOrderInput({ ...baseOrder, deliveryAddress: "no" }).ok).toBe(
      false
    );
    expect(
      validateOrderInput({ ...baseOrder, notes: "x".repeat(1001) }).ok
    ).toBe(false);
  });
});
