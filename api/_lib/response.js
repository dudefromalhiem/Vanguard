export function success(res, data, status = 200) {
  return res.status(status).json({ ok: true, data });
}

export function error(res, message, status = 400) {
  return res.status(status).json({ ok: false, error: message });
}

export function notFound(res, message = 'Not found') {
  return res.status(404).json({ ok: false, error: message });
}

export function methodNotAllowed(res, allowed = []) {
  res.setHeader('Allow', allowed.join(', '));
  return res.status(405).json({ ok: false, error: `Method not allowed. Use: ${allowed.join(', ')}` });
}

export function parseBody(req) {
  // Vercel auto-parses JSON bodies when Content-Type is application/json
  return req.body || {};
}

export function parseQuery(req) {
  // Vercel provides req.query for query string params
  return req.query || {};
}

export function paginate(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}
