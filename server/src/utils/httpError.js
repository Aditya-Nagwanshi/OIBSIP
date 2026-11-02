export class HttpError extends Error {
  constructor(status, message, details = undefined, code = undefined) {
    super(message);
    this.status = status;
    this.details = details;
    this.code = code;
  }
}

export const assert = (condition, status, message, details, code) => {
  if (!condition) throw new HttpError(status, message, details, code);
};
