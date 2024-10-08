const { Webhook } = require("svix"); // مكتبة للتحقق من التواقيع
const { sanitizeEntity } = require("@strapi/utils");

module.exports = async (ctx) => {
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    ctx.throw(400, "Webhook secret not found");
  }

  // الحصول على البيانات من الهيدر الخاص بالـ request
  const svixId = ctx.request.header["svix-id"];
  const svixTimestamp = ctx.request.header["svix-timestamp"];
  const svixSignature = ctx.request.header["svix-signature"];

  if (!svixId || !svixTimestamp || !svixSignature) {
    ctx.throw(400, "Invalid webhook headers");
  }

  // التحقق من التوقيع باستخدام svix
  const webhook = new Webhook(WEBHOOK_SECRET);

  let event;
  try {
    event = webhook.verify(JSON.stringify(ctx.request.body), {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch (error) {
    ctx.throw(400, "Webhook signature verification failed");
  }

  // التعامل مع الحدث
  if (event.type === "user.updated") {
    const { id, email } = event.data;

    // هنا تقوم بإضافة المنطق الخاص بإضافة المستخدمين أو تحديثهم في Strapi
    try {
      // تحقق مما إذا كان المستخدم موجودًا بالفعل
      const existingUser = await strapi
        .query("plugin::users-permissions.user")
        .findOne({ email });

      if (existingUser) {
        // تحديث بيانات المستخدم
        await strapi.query("plugin::users-permissions.user").update(
          { id: existingUser.id },
          {
            data: { email },
          }
        );
      } else {
        // إنشاء مستخدم جديد
        await strapi.query("plugin::users-permissions.user").create({
          data: { email, username: email },
        });
      }
    } catch (error) {
      ctx.throw(500, "Error processing webhook event");
    }
  }

  // إرجاع استجابة ناجحة
  ctx.send({
    message: "Webhook processed successfully",
  });
};