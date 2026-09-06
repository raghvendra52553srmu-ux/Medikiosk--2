/** Consistent success envelope: { success, data, message }. */
export function ok(res, data, message = "Operation successful", status = 200) {
  return res.status(status).json({ success: true, data, message });
}

export function created(res, data, message = "Created successfully") {
  return ok(res, data, message, 201);
}
