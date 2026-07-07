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

export function safeReserveSensitiveFlow(request: ReservationRequest) {
  const product = findProduct(request.productId);

  if (!product) {
    return {
      allowed: false,
      reason: "unknown-product",
      userId: request.userId,
      productId: request.productId,
    };
  }

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

  if (product.sensitiveFlow && request.quantity > product.maxPerUser) {
    return {
      allowed: false,
      reason: "per-user-limit-exceeded",
      userId: request.userId,
      productId: request.productId,
      requestedQuantity: request.quantity,
      maxPerUser: product.maxPerUser,
    };
  }

  if (request.quantity > product.availableStock) {
    return {
      allowed: false,
      reason: "stock-limit-exceeded",
      userId: request.userId,
      productId: request.productId,
      requestedQuantity: request.quantity,
      availableStock: product.availableStock,
    };
  }

  return {
    allowed: true,
    reservation: {
      productId: product.id,
      productLabel: product.label,
      userId: request.userId,
      reservedQuantity: request.quantity,
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
