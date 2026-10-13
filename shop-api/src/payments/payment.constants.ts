// "The bank" Finance talks to. An interface can't be injected by type at runtime (it disappears
// after compiling), so we inject it by a token instead: @Inject(PAYMENT_GATEWAY).
export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');

export interface PaymentGateway {
  charge(amountCents: number, customerId: string): Promise<{ id: string }>;
}
