import type React from "react";
import { useEffect, useId, useRef } from "react";

type CheckoutHandle = { close?: () => void } | null;

type CheckoutScriptOptions = {
  apiBase?: string;
};

type CheckoutOptions = {
  token: string;
  apiBase?: string;
};

type EmbeddedProps = CheckoutOptions & {
  className?: string;
  style?: React.CSSProperties;
  onReady?: (handle: CheckoutHandle) => void;
  onError?: (error: Error) => void;
};

type ButtonProps = CheckoutOptions & {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onReady?: (handle: CheckoutHandle) => void;
  onError?: (error: Error) => void;
};

type CardElementHandle = {
  card: unknown;
  getPayload: () => unknown;
  validate: () => void;
};

type ProviderTokenResult = {
  status: "success" | "error";
  token_id?: string;
  token_type?: string;
  fingerprint_id?: string;
  error_code?: string;
  error_message?: string;
  meta?: Record<string, unknown> | null;
};

type TokenizeCardInput = {
  card_number: string;
  holder_name?: string;
  exp_month: string;
  exp_year: string;
  cvv: string;
  document_number?: string;
  document_type?: "CPF" | "CNPJ";
  email?: string;
};

type TokenizeCardOptions = {
  apiBase?: string;
  evervault?: { enabled?: boolean; js_url?: string; app_id?: string };
  selected_providers?: Array<
    "evervault" | "mercadopago" | "pagarme" | "stripe"
  >;
  providers?: {
    mercadopago?: { public_key?: string; script_url?: string; locale?: string };
    pagarme?: { app_id?: string; public_key?: string; script_url?: string };
    stripe?: {
      public_key?: string;
      script_url?: string;
      card_element?: unknown;
    };
  };
  adapters?: Record<string, (...args: unknown[]) => Promise<unknown>>;
  pix?: { provider?: "abacatepay" | "woovi" };
};

type TokenizeCardResult = {
  success: boolean;
  providers: Record<string, ProviderTokenResult>;
  provider_meta?: Record<string, unknown>;
  masked: { last4: string; brand: string };
  elapsed_ms: number;
};

type CardElementProps = CheckoutScriptOptions & {
  className?: string;
  style?: React.CSSProperties;
  onReady?: (handle: CardElementHandle) => void;
  onError?: (error: Error) => void;
};

declare global {
  interface Window {
    VektopayCheckout?: {
      open: (options: CheckoutOptions) => CheckoutHandle;
      embed: (options: CheckoutOptions & { mount: string }) => CheckoutHandle;
    };
    VektopayElements?: {
      createCard: (
        mountSelector: string,
        options?: CheckoutScriptOptions,
      ) => Promise<CardElementHandle>;
      tokenizeCard?: (
        input: TokenizeCardInput,
        options?: TokenizeCardOptions,
      ) => Promise<TokenizeCardResult>;
      pix?: {
        createCharge?: (
          input: Record<string, unknown>,
          options?: TokenizeCardOptions,
        ) => Promise<unknown>;
      };
    };
  }
}

const scriptCache = new Map<string, Promise<void>>();

function normalizeBase(apiBase?: string) {
  return apiBase ? apiBase.replace(/\/$/, "") : "";
}

async function loadCheckoutScript({ apiBase }: CheckoutScriptOptions) {
  const base = normalizeBase(apiBase);
  const src = `${base}/checkout.js`;
  if (scriptCache.has(src)) return scriptCache.get(src) as Promise<void>;

  const promise = new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") return resolve();
    if (window.VektopayCheckout && window.VektopayElements) return resolve();
    if (document.querySelector(`script[src=\"${src}\"]`)) return resolve();
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("checkout_script_load_failed"));
    document.head.appendChild(script);
  });

  scriptCache.set(src, promise);
  return promise;
}

export function VektopayEmbeddedCheckout({
  token,
  apiBase,
  className,
  style,
  onReady,
  onError,
}: EmbeddedProps) {
  const id = useId().replace(/:/g, "");
  const handleRef = useRef<CheckoutHandle>(null);

  useEffect(() => {
    let active = true;
    loadCheckoutScript({ apiBase })
      .then(() => {
        if (!active || !window.VektopayCheckout) return;
        handleRef.current = window.VektopayCheckout.embed({
          token,
          apiBase,
          mount: `#${id}`,
        });
        onReady?.(handleRef.current);
      })
      .catch((err) => onError?.(err));

    return () => {
      active = false;
      handleRef.current?.close?.();
    };
  }, [token, apiBase, id, onReady, onError]);

  return <div id={id} className={className} style={style} />;
}

export function VektopayCheckoutButton({
  token,
  apiBase,
  children,
  className,
  style,
  onReady,
  onError,
}: ButtonProps) {
  const handleRef = useRef<CheckoutHandle>(null);

  const onClick = async () => {
    try {
      await loadCheckoutScript({ apiBase });
      if (!window.VektopayCheckout) throw new Error("checkout_not_ready");
      handleRef.current = window.VektopayCheckout.open({ token, apiBase });
      onReady?.(handleRef.current);
    } catch (err) {
      onError?.(err as Error);
    }
  };

  return (
    <button type="button" className={className} style={style} onClick={onClick}>
      {children || "Open Checkout"}
    </button>
  );
}

export function VektopayCardElement({
  apiBase,
  className,
  style,
  onReady,
  onError,
}: CardElementProps) {
  const id = useId().replace(/:/g, "");

  useEffect(() => {
    let active = true;
    loadCheckoutScript({ apiBase })
      .then(async () => {
        if (!active || !window.VektopayElements) return;
        const handle = await window.VektopayElements.createCard(`#${id}`, {
          apiBase,
        });
        onReady?.(handle);
      })
      .catch((err) => onError?.(err));

    return () => {
      active = false;
    };
  }, [apiBase, id, onReady, onError]);

  return <div id={id} className={className} style={style} />;
}

export async function tokenizeCard(
  input: TokenizeCardInput,
  options: TokenizeCardOptions = {},
) {
  await loadCheckoutScript({ apiBase: options.apiBase });
  if (!window.VektopayElements?.tokenizeCard) {
    throw new Error("tokenize_card_not_available");
  }
  return window.VektopayElements.tokenizeCard(input, options);
}

export async function createPixCharge(
  input: Record<string, unknown>,
  options: TokenizeCardOptions = {},
) {
  await loadCheckoutScript({ apiBase: options.apiBase });
  if (!window.VektopayElements?.pix?.createCharge) {
    throw new Error("pix_create_charge_not_available");
  }
  return window.VektopayElements.pix.createCharge(input, options);
}

export { loadCheckoutScript };
