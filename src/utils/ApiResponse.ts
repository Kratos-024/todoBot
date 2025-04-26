class ApiResponse {
  public message: string = "";
  public data: unknown;
  public statusCode: number;

  constructor(message: string = "", statusCode: number, data: unknown = null) {
    this.message = message;
    this.statusCode = statusCode;
    this.data = data;
  }
}

export const success = (message = "Success", data?: unknown) => {
  return new ApiResponse(message, 200, data);
};

export const created = (message = "Created", data?: unknown) => {
  return new ApiResponse(message, 201, data);
};

export const accepted = (message = "Accepted", data?: unknown) => {
  return new ApiResponse(message, 202, data);
};

export const noContent = (message = "No Content", data?: unknown) => {
  return new ApiResponse(message, 204, data);
};
