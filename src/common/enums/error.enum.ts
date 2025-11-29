export enum ErrorSystemCode {
  MISSING_REQUIRED_PARAMETERS = 400105,
  FORBIDDEN_REQUEST = 403403,
  UNAUTHORIZED_REQUEST = 401108,
  PARAMETER_VALUE_LENGTH_EXCEEDED = 400110,
  INVALID_VALUE = 400111,
  INVALID_URL_OF_RESOURCE = 400114,
  NOT_ALLOWED_CHARACTER = 400151,
  RESOURCE_NOT_FOUND = 400201,
  RESOURCE_ALREADY_EXISTS = 400202,
  TOO_MANY_ITEMS_IN_PARAMETER = 400203,
  DEACTIVATED_USER_NOT_ACCESSIBLE = 400300,
  USER_NOT_FOUND = 400301,
  INVALID_ACCESS_TOKEN = 401302,
  INVALID_SESSION_KEY_VALUE = 401303,
  APPLICATION_NOT_FOUND = 400304,
  PAID_QUOTA_EXCEEDED = 400306,
  DOMAIN_NOT_ALLOWED = 400307,
  INVALID_API_TOKEN = 400401,
  INVALID_JSON_REQUEST_BODY = 400403,
  TOO_MANY_USER_WEBSOCKET_CONNECTIONS = 400500,
  BLOCKED_USER_SEND_NOT_ALLOWED = 400700,
  BLOCKED_USER_INVITED_NOT_ALLOWED = 400701,
  BLOCKED_USER_INVITE_NOT_ALLOWED = 400702,
  BANNED_USER_ENTER_CHANNEL_NOT_ALLOWED = 400750,
  UNACCEPTABLE = 400920,
  REQUEST_DENIED = 400921,
  RATE_LIMIT_EXCEEDED = 500910,
  INTERNAL_ERROR_PUSH_TOKEN_NOT_REGISTERED = 500601,
  INTERNAL_ERROR = 500901,
}

export const ErrorSystemMessage = {
  400105: 'The request is missing one or more required parameters.',
  401108: "The request isn't authorized and can't access the requested resource.",
  400110: 'The length of the parameter value is too long.',
  400111: 'The request specifies an invalid value.',
  400114: "The resource identified with the URL in the request can't be found.",
  400151:
    'The request specifies an unacceptable value containing special character, empty string, or white space.',
  400201: "The resource identified with the request's parameter can't be found.",
  400202: "The resource identified with the request's parameter already exists",
  400203: 'The parameter specifies more items than allowed.',
  403403: 'Insufficient permissions',
  400300: "The request can't retrieve the deactivated user data.",
  400301:
    "The user identified with the request's parameter can't be found because either the user doesn't exist or has been deleted.",
  401302: 'The access token provided for the request specifies an invalid value.',
  401303: 'The session key provided for the request specifies an invalid value.',
  400304: "The application identified with the request can't be found.",
  400306: "The request can't be completed because you have exceeded your plan's paid quota.",
  400307: "The request can't be completed because it came from a restricted domain.",
  400401: 'The API token provided for the request specifies an invalid value.',
  400403: 'The request body is an invalid JSON.',
  400500: "The number of the user's websocket connections exceeds the allowed amount.",
  400700:
    "The request can't be completed due to one of the following reasons: The sender is blocked by the recipient or has been deactivated, the message is longer than the maximum message length, or the message contains texts or URLs blocked by application settings or filters.",
  400701:
    "The request can't be completed because the blocking user is trying to invite the blocked user to a channel.",
  400702:
    "The request can't be completed because a blocked user is trying to invite the user who blocked them to a channel.",
  400750:
    "The request can't be completed because the user is trying to enter a channel that they are banned from.",
  400920:
    "The request is unacceptable because the combination of parameter values is invalid. Even if each parameter value is valid, a combination of parameter values becomes invalid when it doesn't follow specific conditions.",
  400921: 'The request is denied because the API call was made from an unauthorized IP.',
  500910: "The request can't be completed because you have exceeded your rate limits.",
  500601:
    "The server encounters an error while trying to register the user's push token. Please retry the request.",
  500901:
    'The server encounters an unexpected exception while trying to process the request. Please retry the request.',
};
