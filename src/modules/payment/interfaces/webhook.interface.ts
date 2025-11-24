/**
 * PayPal webhook payload interface
 */
export interface PayPalWebhookPayload {
  event_type?: string;
  resource?: {
    id?: string;
    status?: string;
    amount?: {
      total?: string;
      currency?: string;
    };
    [key: string]: any;
  };
  [key: string]: any; // PayPal webhook can have many fields
}

/**
 * PayPal webhook headers interface
 */
export interface PayPalWebhookHeaders {
  'paypal-transmission-id'?: string;
  'paypal-transmission-time'?: string;
  'paypal-cert-url'?: string;
  'paypal-auth-algo'?: string;
  'paypal-transmission-sig'?: string;
  [key: string]: string | string[] | undefined; // HTTP headers
}

