/**
 * Wrap async route handlers so rejections reach `errorHandler`.
 * @template {import('express').RequestHandler} T
 * @param {T} fn
 * @returns {T}
 */
export function asyncHandler(fn) {
  return /** @type {T} */ (
    function asyncWrapped(req, res, next) {
      Promise.resolve(fn(req, res, next)).catch(next)
    }
  )
}
