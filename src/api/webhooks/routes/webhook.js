module.exports = {
  routes: [
    {
      method: "POST",
      path: "/webhooks",
      handler: "webhook.index",
      config: {
        auth: false, // تأكد أن الـ Route غير محمي لأن الطلبات تأتي من Clerk
      },
    },
  ],
};
