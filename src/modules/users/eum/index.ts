/**
 * The ID of the provider used to sign in the user.
 * One of `"anonymous"`, `"password"`, `"facebook.com"`, `"github.com"`,
 * `"google.com"`, `"twitter.com"`, `"apple.com"`, `"microsoft.com"`,
 * `"yahoo.com"`, `"phone"`, `"playgames.google.com"`, `"gc.apple.com"`,
 * or `"custom"`.
 *
 * Additional Identity Platform provider IDs include `"linkedin.com"`,
 * OIDC and SAML identity providers prefixed with `"saml."` and `"oidc."`
 * respectively.
 */
export enum ProviderEnum {
  ANONYMOUS = 'anonymous',
  PASSWORD = 'password',
  PHONE = 'phone',
  FACEBOOK = 'facebook.com',
  GITHUB = 'github.com',
  GOOGLE = 'google.com',
  TWITTER = 'twitter.com',
  APPLE = 'apple.com',
  MICROSOFT = 'microsoft.com',
  YAHOO = 'yahoo.com',
  PLAY_GAMES = 'playgames.google.com',
  GC_APPLE = 'gc.apple.com',
  LINKEDIN = 'linkedin.com',
  CUSTOM = 'custom',
  WALLET = 'wallet',
}

export enum GenderEnum {
  Male = 'male',
  Female = 'female',
}

export enum KeyAttributesEnum {
  DT = 'dt',
  DI = 'di',
  DM = 'dm',
  OV = 'ov',
  CT = 'ct',
  LANG = 'lang',
  LOCATION = 'location',
  IP = 'ip',
  TIMEZONE = 'timezone',
}
