var hexcase = 0,
  b64pad = "",
  chrsz = 8;
function hex_sha1(r) {
  return binb2hex(core_sha1(str2binb(r), r.length * chrsz));
}
function b64_sha1(r) {
  return binb2b64(core_sha1(str2binb(r), r.length * chrsz));
}
function str_sha1(r) {
  return binb2str(core_sha1(str2binb(r), r.length * chrsz));
}
function hex_hmac_sha1(r, n) {
  return binb2hex(core_hmac_sha1(r, n));
}
function b64_hmac_sha1(r, n) {
  return binb2b64(core_hmac_sha1(r, n));
}
function str_hmac_sha1(r, n) {
  return binb2str(core_hmac_sha1(r, n));
}
function sha1_vm_test() {
  return "a9993e364706816aba3e25717850c26c9cd0d89d" == hex_sha1("abc");
}
function core_sha1(r, n) {
  (r[n >> 5] |= 128 << (24 - (n % 32))), (r[(((n + 64) >> 9) << 4) + 15] = n);
  for (
    var a = Array(80),
      h = 1732584193,
      t = -271733879,
      e = -1732584194,
      c = 271733878,
      s = -1009589776,
      _ = 0;
    _ < r.length;
    _ += 16
  ) {
    for (var o = h, $ = t, b = e, f = c, u = s, i = 0; i < 80; i++) {
      i < 16
        ? (a[i] = r[_ + i])
        : (a[i] = rol(a[i - 3] ^ a[i - 8] ^ a[i - 14] ^ a[i - 16], 1));
      var d = safe_add(
        safe_add(rol(h, 5), sha1_ft(i, t, e, c)),
        safe_add(safe_add(s, a[i]), sha1_kt(i))
      );
      (s = c), (c = e), (e = rol(t, 30)), (t = h), (h = d);
    }
    (h = safe_add(h, o)),
      (t = safe_add(t, $)),
      (e = safe_add(e, b)),
      (c = safe_add(c, f)),
      (s = safe_add(s, u));
  }
  return [h, t, e, c, s];
}
function sha1_ft(r, n, a, h) {
  return r < 20
    ? (n & a) | (~n & h)
    : r < 40
    ? n ^ a ^ h
    : r < 60
    ? (n & a) | (n & h) | (a & h)
    : n ^ a ^ h;
}
function sha1_kt(r) {
  return r < 20
    ? 1518500249
    : r < 40
    ? 1859775393
    : r < 60
    ? -1894007588
    : -899497514;
}
function core_hmac_sha1(r, n) {
  var a = str2binb(r);
  a.length > 16 && (a = core_sha1(a, r.length * chrsz));
  for (var h = Array(16), t = Array(16), e = 0; e < 16; e++)
    (h[e] = 909522486 ^ a[e]), (t[e] = 1549556828 ^ a[e]);
  var c = core_sha1(h.concat(str2binb(n)), 512 + n.length * chrsz);
  return core_sha1(t.concat(c), 672);
}
function safe_add(r, n) {
  var a = (65535 & r) + (65535 & n);
  return (((r >> 16) + (n >> 16) + (a >> 16)) << 16) | (65535 & a);
}
function rol(r, n) {
  return (r << n) | (r >>> (32 - n));
}
function str2binb(r) {
  for (
    var n = [], a = (1 << chrsz) - 1, h = 0;
    h < r.length * chrsz;
    h += chrsz
  )
    n[h >> 5] |= (r.charCodeAt(h / chrsz) & a) << (32 - chrsz - (h % 32));
  return n;
}
function binb2str(r) {
  for (var n = "", a = (1 << chrsz) - 1, h = 0; h < 32 * r.length; h += chrsz)
    n += String.fromCharCode((r[h >> 5] >>> (32 - chrsz - (h % 32))) & a);
  return n;
}
function binb2hex(r) {
  for (
    var n = hexcase ? "0123456789ABCDEF" : "0123456789abcdef", a = "", h = 0;
    h < 4 * r.length;
    h++
  )
    a +=
      n.charAt((r[h >> 2] >> ((3 - (h % 4)) * 8 + 4)) & 15) +
      n.charAt((r[h >> 2] >> ((3 - (h % 4)) * 8)) & 15);
  return a;
}
function binb2b64(r) {
  for (var n = "", a = 0; a < 4 * r.length; a += 3)
    for (
      var h =
          (((r[a >> 2] >> (8 * (3 - (a % 4)))) & 255) << 16) |
          (((r[(a + 1) >> 2] >> (8 * (3 - ((a + 1) % 4)))) & 255) << 8) |
          ((r[(a + 2) >> 2] >> (8 * (3 - ((a + 2) % 4)))) & 255),
        t = 0;
      t < 4;
      t++
    )
      8 * a + 6 * t > 32 * r.length
        ? (n += b64pad)
        : (n +=
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(
              (h >> (6 * (3 - t))) & 63
            ));
  return n;
}
export { str_sha1, str_hmac_sha1 };
