export type ReservationRequest = {
  userId: string;
  productId: string;
  quantity: number;
  flowStep: "cart-confirmed" | "direct-checkout";
};

type DemoProduct = {
  id: string;
  label: string;
  availableStock: number;
  maxPerUser: number;
  sensitiveFlow: boolean;
};

const demoProducts: DemoProduct[] = [
  {
    id: "product-demo-001",
    label: "limited-api-lab-ticket",
    availableStock: 3,
    maxPerUser: 1,
    sensitiveFlow: true,
  },
];

const automationWindowMs = 60_000;
const maxAttemptsPerWindow = 3;
const remainingStockByProduct = new Map<string, number>();
const reservedByUserAndProduct = new Map<string, number>();
const attemptsByUserAndProduct = new Map<
  string,
  { count: number; resetAt: number }
>();

function findProduct(productId: string) {
  return demoProducts.find((product) => product.id === productId);
}

export function unsafeReserveSensitiveFlow(request: ReservationRequest) {
  const product = findProduct(request.productId);

  return {
    accepted: true,
    productId: request.productId,
    productLabel: product?.label ?? "unknown-demo-product",
    userId: request.userId,
    requestedQuantity: request.quantity,
    reservedQuantity: request.quantity,
    flowStep: request.flowStep,
    checks: {
      flowOrderChecked: false,
      perUserLimitChecked: false,
      stockCheckedBeforeReservation: false,
      automationPatternChecked: false,
    },
    risk: "Sensitive business flow accepted without flow order, per-user limit, or stock abuse checks.",
  };
}

export function safeReserveSensitiveFlow(
  request: ReservationRequest,
  now = Date.now(),
) {
  const product = findProduct(request.productId);

  if (!product) {
    return {
      allowed: false,
      reason: "unknown-product",
      userId: request.userId,
      productId: request.productId,
    };
  }

  const stateKey = `${request.userId}:${request.productId}`;
  const currentAttempts = attemptsByUserAndProduct.get(stateKey);
  const attempts =
    !currentAttempts || currentAttempts.resetAt <= now
      ? { count: 0, resetAt: now + automationWindowMs }
      : currentAttempts;

  if (attempts.count >= maxAttemptsPerWindow) {
    return {
      allowed: false,
      reason: "automation-attempt-limit-exceeded",
      userId: request.userId,
      productId: request.productId,
      maxAttempts: maxAttemptsPerWindow,
      retryAfterMs: attempts.resetAt - now,
    };
  }

  attempts.count += 1;
  attemptsByUserAndProduct.set(stateKey, attempts);

  if (request.flowStep !== "cart-confirmed") {
    return {
      allowed: false,
      reason: "flow-order-violation",
      userId: request.userId,
      productId: request.productId,
      requiredStep: "cart-confirmed",
      receivedStep: request.flowStep,
    };
  }

  const reservedByUser = reservedByUserAndProduct.get(stateKey) ?? 0;
  const cumulativeQuantity = reservedByUser + request.quantity;

  if (product.sensitiveFlow && cumulativeQuantity > product.maxPerUser) {
    return {
      allowed: false,
      reason: "per-user-limit-exceeded",
      userId: request.userId,
      productId: request.productId,
      requestedQuantity: request.quantity,
      alreadyReservedQuantity: reservedByUser,
      maxPerUser: product.maxPerUser,
    };
  }

  const remainingStock =
    remainingStockByProduct.get(product.id) ?? product.availableStock;

  if (request.quantity > remainingStock) {
    return {
      allowed: false,
      reason: "stock-limit-exceeded",
      userId: request.userId,
      productId: request.productId,
      requestedQuantity: request.quantity,
      availableStock: remainingStock,
    };
  }

  const updatedRemainingStock = remainingStock - request.quantity;
  remainingStockByProduct.set(product.id, updatedRemainingStock);
  reservedByUserAndProduct.set(stateKey, cumulativeQuantity);

  return {
    allowed: true,
    reservation: {
      productId: product.id,
      productLabel: product.label,
      userId: request.userId,
      reservedQuantity: request.quantity,
      cumulativeReservedQuantity: cumulativeQuantity,
      remainingStock: updatedRemainingStock,
      flowStep: request.flowStep,
      controls: {
        flowOrderChecked: true,
        perUserLimitChecked: true,
        stockCheckedBeforeReservation: true,
        automationPatternChecked: true,
      },
    },
  };
}

export function resetBusinessFlowState() {
  remainingStockByProduct.clear();
  reservedByUserAndProduct.clear();
  attemptsByUserAndProduct.clear();
}
