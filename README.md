# @vektopay/react

Thin React wrappers for Vektopay checkout. The core UI and security live in `checkout.js` served by the API Gateway.

## Install

```bash
bun add @vektopay/react
# or
npm install @vektopay/react
```

## Usage

### 1) Create A Token Server-Side

Your backend should create a checkout session token (via `POST /v1/checkout-sessions`) and send that token to the browser.
Payments are created via `/v1/payments` inside the checkout flow.

### 2) Use The Token In The Browser

```tsx
import {
  VektopayCheckoutButton,
  VektopayEmbeddedCheckout,
  VektopayCardElement,
} from "@vektopay/react";

export function App() {
  return (
    <div>
      <VektopayCheckoutButton token="your_token" apiBase="http://localhost:3000">
        Pay now
      </VektopayCheckoutButton>

      <VektopayEmbeddedCheckout token="your_token" apiBase="http://localhost:3000" />

      <VektopayCardElement apiBase="http://localhost:3000" />
    </div>
  );
}
```

## Build

```bash
bun install
bun run build
```

## Publish

```bash
npm version patch
npm publish --access public
```

## Notes
- Tokens are created server-side. Never expose secret keys in the browser.
