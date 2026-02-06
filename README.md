# @vektopay/react

Thin React wrappers for Vektopay checkout. The core UI and security live in `checkout.js` served by the API Gateway.

## Install

```bash
bun add @vektopay/react
# or
npm install @vektopay/react
```

## Usage

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
