import { findLabResource, findLabUser } from "@/data/lab-samples";

export type OrderAccessResult =
  | {
      ok: true;
      order: NonNullable<ReturnType<typeof findLabResource>>;
      owner: NonNullable<ReturnType<typeof findLabUser>>;
    }
  | { ok: false; reason: "not-found" | "owner-not-found" | "forbidden" };

export function getOrderByIdOnly(orderId: string): OrderAccessResult {
  const order = findLabResource(orderId);

  if (!order || order.resourceType !== "order") {
    return { ok: false, reason: "not-found" };
  }

  const owner = findLabUser(order.ownerId);

  if (!owner) {
    return { ok: false, reason: "owner-not-found" };
  }

  return { ok: true, order, owner };
}

export function getOrderWithOwnershipCheck(
  orderId: string,
  userId: string,
): OrderAccessResult {
  const result = getOrderByIdOnly(orderId);

  if (!result.ok) {
    return result;
  }

  if (result.order.ownerId !== userId) {
    return { ok: false, reason: "forbidden" };
  }

  return result;
}

export function toOrderResponse(
  result: Extract<OrderAccessResult, { ok: true }>,
) {
  return {
    order: result.order,
    owner: {
      id: result.owner.id,
      displayName: result.owner.displayName,
      role: result.owner.role,
    },
  };
}
