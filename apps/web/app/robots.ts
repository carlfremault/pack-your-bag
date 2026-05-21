export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/login',
      disallow: '/',
    },
  };
}
