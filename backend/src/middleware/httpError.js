export class HttpError extends Error {
  /**
   * @param {number} status - HTTP status (400, 404, 409, …)
   * @param {string} message
   */
  constructor(status, message) {
    super(message)
    this.status = status
    this.name = 'HttpError'
  }
}
