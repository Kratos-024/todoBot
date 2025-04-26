class ApiError extends Error {
  public message: string = "";
  public data: unknown;
  public statusCode: number;

  constructor(message: string = "", statusCode: number, data: unknown = null) {
    super(message);
    this.message = message;
    this.statusCode = statusCode;
    this.data = data;
  }
}

export const badRequest = (message = "Bad Request", data?: unknown) => {
  return new ApiError(message, 400, data);
};

export const unauthorized = (message = "Unauthorized", data?: unknown) => {
  return new ApiError(message, 401, data);
};

export const forbidden = (message = "Forbidden", data?: unknown) => {
  return new ApiError(message, 403, data);
};

export const notFound = (message = "Not Found", data?: unknown) => {
  return new ApiError(message, 404, data);
};

export const conflict = (message = "Conflict", data?: unknown) => {
  return new ApiError(message, 409, data);
};

export const internalServerError = (
  message = "Internal Server Error",
  data?: unknown
) => {
  return new ApiError(message, 500, data);
};

export const serviceUnavailable = (
  message = "Service Unavailable",
  data?: unknown
) => {
  return new ApiError(message, 503, data);
};
