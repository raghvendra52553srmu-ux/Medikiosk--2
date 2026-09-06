/** Routes stay free of try/catch; rejected promises reach the error middleware. */
export const asyncHandler =
  (fn) =>
  (req, res, next) => {
    void Promise.resolve(fn(req, res, next)).catch(next);
  };
