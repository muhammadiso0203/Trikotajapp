import { ProductService } from 'src/Service/product.service';
import { SewingService } from 'src/Service/sawing.service';
import { UserService } from 'src/Service/user.service';
import { Context, Markup } from 'telegraf';

export function getAdminPanel() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('➕ Mahsulot qo‘shish', 'ADD_NEW_PRODUCT')],
    [Markup.button.callback('✏️ Mahsulotni tahrirlash', 'EDIT_PRODUCT')],
    [Markup.button.callback('👷‍♂️ Ishchi qo‘shish', 'ADD_WORKER')],
    [Markup.button.callback('🧑‍🏭 Ishchilar ro‘yxati', 'list_workers')],
  ]);
}



export async function handleEditProduct(
  ctx: Context,
  productService: ProductService,
) {
  await ctx.answerCbQuery();

  const products = await productService.getAllProduct();

  if (!products.length) {
    await ctx.reply('❗️ Hozircha mahsulotlar mavjud emas.');
    return;
  }

  const buttons = products.map((p) => [
    Markup.button.callback(`✏️ ${p.name}`, `EDIT_SELECT_${p.id}`),
  ]);

  await ctx.reply(
    '🛠 Qaysi mahsulotni tahrirlamoqchisiz?',
    Markup.inlineKeyboard(buttons),
  );
}

export async function handleProductEditSelect(
  ctx: Context,
  step: Map<number, any>,
) {
  await ctx.answerCbQuery();
  const productId = (ctx.callbackQuery as any).data.split('_')[2];
  const userId = ctx.from?.id;

  if (!productId || !userId) {
    await ctx.reply('❌ Xatolik yuz berdi.');
    return;
  }

  step.set(userId, {
    step: 'editing_product_name',
    productId,
  });

  await ctx.reply('✏️ Yangi mahsulot nomini kiriting:');
}

export async function handleAddWorker(ctx: Context, step: Map<number, any>) {
  await ctx.answerCbQuery();
  const userId = ctx.from?.id;

  if (!userId) {
    await ctx.reply('❌ Foydalanuvchi aniqlanmadi.');
    return;
  }

  step.set(userId, {
    step: 'awaiting_worker_name',
  });

  await ctx.reply('👤 Ishchi FIOsini kiriting:');
}

export async function handleListWorkers(
  ctx: Context,
  userService: UserService,
  sewingService: SewingService,
) {
  await ctx.answerCbQuery();

  const workers = await userService.getAllWorker();

  if (!workers.length) {
    await ctx.reply('🚫 Hali hech qanday ishchi ro‘yxatga olinmagan.');
    return;
  }

  for (const worker of workers) {
    const stats = await sewingService.getUserStats(worker.id);

    let message = `👤 <b>${worker.full_name}</b>\n📞 ${worker.phone_number}\n🆔 <code>${worker.telegramId}</code>\n\n`;

    if (!stats.length) {
      message += '📉 Hali hech qanday mahsulot tikmagan.\n';
    } else {
      let totalSalary = 0;

      for (const stat of stats) {
        const name = stat.productName;
        const quantity = stat.totalQuantity;
        const price = stat.unitPrice;
        const salary = stat.totalSalary;

        totalSalary += Number(salary);

        message += `📦 ${name} — ${quantity} dona × ${price} so'm\n💰 ${salary} so‘m\n\n`;
      }

      message += `🔢 Umumiy maosh: <b>${totalSalary} so‘m</b>`;
    }

    await ctx.reply(message, { parse_mode: 'HTML' });
  }
}

