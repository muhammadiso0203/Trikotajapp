import { Injectable } from '@nestjs/common';
import { Start, Ctx, On, Action, Update } from 'nestjs-telegraf';
import { ProductService } from 'src/Service/product.service';
import { UserService } from 'src/Service/user.service';
import { Context, Markup } from 'telegraf';
import {
  CallbackQuery,
  Update as TgRawUpdate,
  User,
} from 'telegraf/typings/core/types/typegram';
import {
  getAdminPanel,
  handleAddWorker,
  handleEditProduct,
  handleListWorkers,
  handleProductEditSelect,
} from './admin.panel';
import { SewingService } from 'src/Service/sawing.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersEntity } from 'src/entities/users.entity';

@Update()
@Injectable()
export class BotService {
  private step = new Map<number, any>();

  constructor(
    @InjectRepository(UsersEntity)
    private readonly userRepo: Repository<UsersEntity>,
    private readonly userService: UserService,
    private readonly productService: ProductService,
    private readonly sawingService: SewingService,
  ) {}

  @Start()
  async onStart(@Ctx() ctx: Context) {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const user = await this.userService.getByTelegramId(telegramId);

    if (user && user.phone_number) {
      await ctx.reply(
        `👋 Xush kelibsiz, ${user.full_name || 'foydalanuvchi'}!`,
      );
      await this.sendMainMenu(ctx);
      return;
    }

    await ctx.reply(
      '📱 Iltimos, telefon raqamingizni yuboring:',
      Markup.keyboard([Markup.button.contactRequest('📤 Raqamni yuborish')])
        .oneTime()
        .resize(),
    );
  }

  sendMainMenu(ctx: Context<TgRawUpdate>) {
    return ctx.reply(
      '📋 Asosiy menyu:',
      Markup.inlineKeyboard([
        [Markup.button.callback('🧵 Mahsulot kiritish', 'ADD_PRODUCT')],
        [Markup.button.callback('📦 Mening mahsulotlarim', 'MY_PRODUCT')],
        [Markup.button.callback('📊 Statistikam', 'MY_STATS')],
        [Markup.button.callback('💰 Oyliklarim', 'MY_SALARY')],
      ]),
    );
  }

  @On('contact')
  async handleContact(@Ctx() ctx: Context) {
    const message: any = ctx.message;
    const contact = message.contact;
    const telegramId = ctx.from?.id;

    if (typeof telegramId !== 'number') {
      await ctx.reply('❌ Telegram ID aniqlanmadi.');
      return;
    }

    const tgUser = ctx.from;
    if (!contact || !tgUser) {
      await ctx.reply(
        '❌ Maʼlumotlar to‘liq emas. Iltimos qaytadan urinib ko‘ring.',
      );
      return;
    }

    const fullName =
      `${contact.first_name ?? ''} ${contact.last_name ?? ''}`.trim();
    const phone = contact.phone_number;
    const username = tgUser.username ?? 'no_username';

    const user = await this.userService.createIfNotExists(
      phone,
      fullName,
      username,
      telegramId,
    );

    await ctx.reply(
      `✅ Rahmat, ${user.full_name}.`,
      Markup.inlineKeyboard([
        [Markup.button.callback('🧵 Mahsulot kiritish', 'ADD_PRODUCT')],
        [Markup.button.callback('📊 Statistikam', 'MY_STATS')],
        [Markup.button.callback('💰 Oyliklarim', 'MY_SALARY')],
        [Markup.button.callback('📦 Mening mahsulotlarim', 'MY_PRODUCT')],
      ]),
    );
  }

  @Action('ADD_PRODUCT')
  async handleAddProduct(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();

    const products = await this.productService.getAllProduct();

    if (products.length === 0) {
      await ctx.reply('🚫 Hozircha hech qanday mahsulot mavjud emas.');
      return;
    }

    const inlineButtons = products.map((product) => [
      Markup.button.callback(product.name, `SELECT_PRODUCT_${product.id}`),
    ]);

    await ctx.reply(
      '🧵 Mahsulotlardan birini tanlang:',
      Markup.inlineKeyboard(inlineButtons),
    );
  }

  @Action(/^SELECT_PRODUCT_(.+)$/)
  async handleProductSelected(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();

    const data = (ctx.callbackQuery as any)?.data;
    if (!data) {
      await ctx.reply("❗️ Callback ma'lumot topilmadi.");
      return;
    }

    const parts = data.split('_');
    const productId = parts[2];

    const userId = ctx.from?.id;
    if (!userId || !productId) {
      await ctx.reply('❗️ Foydalanuvchi yoki mahsulot aniqlanmadi.');
      return;
    }

    this.step.set(userId, {
      step: 'awaiting_quantity',
      productId,
    });

    await ctx.reply('🔢 Iltimos, nechta tikkaningizni kiriting:');
  }

  @Action('MY_STATS')
  async handleMyStats(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();
    const userId = ctx.from?.id;
    if (!userId) return;

    const user = await this.userService.getByTelegramId(userId);
    if (!user) {
      await ctx.reply('❌ Foydalanuvchi topilmadi.');
      return;
    }

    const stats = await this.sawingService.getUserStats(user.id);

    if (stats.length === 0) {
      await ctx.reply('📉 Hozircha hech qanday mahsulot tikmagansiz.');
      return;
    }

    let totalSalary = 0;
    let message = '📊 Sizning tikuv statistikangiz:\n\n';
    console.log(stats);

    for (const stat of stats) {
      const name = stat.productname;
      const quantity = stat.totalquantity;
      const price = stat.unitprice;
      const salary = stat.totalsalary;

      totalSalary += parseInt(salary);
      message += `📦 ${name} — ${quantity} dona, ${price} so'mdan\n💰 ${salary} so‘m\n\n`;
    }

    message += `🧮 Umumiy maosh: ${totalSalary} so‘m`;

    await ctx.reply(message);
  }

  @Action('MY_PRODUCT')
  async onMyProducts(@Ctx() ctx: Context): Promise<void> {
    const telegramId = ctx.from?.id;

    if (!telegramId) {
      await ctx.reply('❗️ Foydalanuvchi aniqlanmadi.');
      return;
    }

    const products = await this.productService.getUserProducts(telegramId);
    const sewings = await this.sawingService.getUserSewings(telegramId);

    if (!products.length) {
      await ctx.reply('📦 Siz hech qanday mahsulot tikmagansiz.');
      return;
    }

    for (const sewing of sewings) {
      const product = sewing.product;
      const quantity = sewing.quantity;

      await ctx.reply(
        `📦 ${product.name}\n💰 ${product.unit_price} so‘m\n📝 ${product.description}\n🧵 Siz tikkan: ${quantity} dona`,
        {
          reply_markup: Markup.inlineKeyboard([
            [
              Markup.button.callback(
                '🗑 O‘chirish',
                `DELETE_SEWING_${sewing.id}`,
              ),
            ],
          ]).reply_markup,
        },
      );
      return;
    }
  }

  @Action(/DELETE_SEWING_(.+)/)
  async onDeleteSewedProduct(@Ctx() ctx: Context) {
    try {
      const callbackData = ctx.callbackQuery as CallbackQuery.DataQuery;
      const match = callbackData.data.match(/DELETE_SEWING_(.+)/);
      const sewingId = match?.[1];
      const userId = Number(ctx.from?.id);

      if (!sewingId) {
        return ctx.reply('❌ Mahsulot ID topilmadi.');
      }

      await this.sawingService.removeSewedProduct(userId, sewingId);

      await ctx.editMessageReplyMarkup(undefined);
      await ctx.reply('🗑 Tikkan mahsulotingiz o‘chirildi.');
      await ctx.answerCbQuery();
    } catch (error) {
      console.error('❌ O‘chirishda xatolik:', error);
      await ctx.reply('❌ O‘chirishda xatolik yuz berdi.');
    }
  }

  @Action('MY_SALARY')
  async handleMySalary(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();

    const telegramId = ctx.from?.id;
    if (!telegramId) {
      await ctx.reply('❗️ Foydalanuvchi aniqlanmadi.');
      return;
    }

    const user = await this.userService.getByTelegramId(telegramId);
    if (!user) {
      await ctx.reply('❌ Siz ro‘yxatdan o‘tmagansiz.');
      return;
    }

    const result = await this.sawingService.getUserSalary(user.id);

    const totalSalary = result?.totalSalary;

    if (!totalSalary || Number(totalSalary) === 0) {
      await ctx.reply('💰 Siz hali oylik ishlab topmagansiz.');
      return;
    }

    await ctx.reply(
      `💵 Sizning umumiy oylik daromadingiz: ${totalSalary} so‘m`,
    );
  }

  @Action('OPEN_ADMIN_PANEL')
  async openAdminPanel(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();
    await ctx.reply('🛠 Admin panelga xush kelibsiz:', getAdminPanel());
  }

  @Action('ADD_WORKER')
  async onAddWorker(@Ctx() ctx: Context) {
    await handleAddWorker(ctx, this.step);
  }

  @Action('list_workers')
async onListWorkers(@Ctx() ctx: Context) {
  await handleListWorkers(ctx, this.userService, this.sawingService);
}


  @Action('ADD_NEW_PRODUCT')
  async onAddProductAdmin(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();

    const userId = ctx.from?.id;
    if (!userId) {
      await ctx.reply('❌ Foydalanuvchi aniqlanmadi.');
      return;
    }

    this.step.set(userId, { step: 'awaiting_new_product_name' });

    await ctx.reply('📦 Yangi mahsulot nomini kiriting:');
  }

  @Action('EDIT_PRODUCT')
  async onEditProduct(@Ctx() ctx: Context) {
    await handleEditProduct(ctx, this.productService);
  }

  @Action(/^EDIT_SELECT_(.+)$/)
  async onEditSelect(@Ctx() ctx: Context) {
    await handleProductEditSelect(ctx, this.step);
  }

  @On('text')
  async handleText(@Ctx() ctx: Context) {
    const userId = ctx.from?.id;
    const message = ctx.message as any;

    if (!message?.text || !userId) return;

    const text = message.text.trim();
    const currentStep = this.step.get(userId);

    if (currentStep?.step === 'awaiting_quantity') {
      const quantity = parseInt(text);

      if (isNaN(quantity) || quantity <= 0) {
        await ctx.reply('❗️ Iltimos, to‘g‘ri son kiriting (masalan: 10)');
        return;
      }

      const productId = currentStep.productId;
      const product = await this.productService.GetByIdProduct(productId);
      const user = await this.userService.getByTelegramId(userId);

      if (!product || !user) {
        await ctx.reply('❌ Foydalanuvchi yoki mahsulot topilmadi.');
        return;
      }

      await this.sawingService.create(user, product, quantity);

      await ctx.reply(
        `✅ ${product.name} mahsulotidan ${quantity} dona tikkaningiz saqlandi.`,
      );
      this.step.delete(userId);
      return;
    }

    if (text === '/admin') {
      await ctx.reply('🛠 Admin panelga xush kelibsiz:', getAdminPanel());
      return;
    }

    if (currentStep?.step === 'awaiting_new_product_name') {
      const productName = text;

      if (!productName || productName.length < 2) {
        await ctx.reply('❗️ Mahsulot nomi juda qisqa. Qaytadan kiriting.');
        return;
      }

      this.step.set(userId, {
        step: 'awaiting_new_product_price',
        name: productName,
      });

      await ctx.reply('💰 Endi mahsulot narxini kiriting:');
      return;
    }

    if (currentStep?.step === 'awaiting_new_product_price') {
      const name = currentStep.name;
      const unit_price = parseInt(text);

      if (!name) {
        await ctx.reply(
          '❌ Mahsulot nomi aniqlanmadi. Iltimos, qaytadan boshlang.',
        );
        this.step.delete(userId);
        return;
      }

      if (isNaN(unit_price) || unit_price <= 0) {
        await ctx.reply('❌ Narx noto‘g‘ri. Masalan: 5000');
        return;
      }

      this.step.set(userId, {
        step: 'awaiting_new_product_description',
        name,
        unit_price,
      });

      await ctx.reply('📄 Endi mahsulot tavsifini (description) kiriting:');
      return;
    }

    if (currentStep?.step === 'awaiting_new_product_description') {
      const { name, unit_price } = currentStep;
      const description = text;

      if (!name || !unit_price) {
        await ctx.reply('❌ Ma’lumotlar topilmadi. Qaytadan urinib ko‘ring.');
        this.step.delete(userId);
        return;
      }

      await this.productService.createProduct(name, unit_price, description);

      await ctx.reply(
        `✅ Yangi mahsulot qo‘shildi:\n📦 ${name}\n💰 ${unit_price} so‘m\n📄 ${description}`,
      );

      this.step.delete(userId);
      return;
    }

    if (currentStep?.step === 'editing_product_name') {
      const newName = text;
      const productId = currentStep.productId;
      const userId = ctx.from?.id;

      if (!newName || !userId) {
        await ctx.reply('❌ Noto‘g‘ri nom. Qaytadan urinib ko‘ring.');
        this.step.delete(userId);
        return;
      }

      this.step.set(userId, {
        step: 'editing_product_price',
        productId,
        name: newName,
      });

      await ctx.reply('💰 Endi yangi narxni kiriting (so‘mda):');
      return;
    }

    if (currentStep?.step === 'editing_product_price') {
      const newPrice = parseInt(text);
      const { productId, name } = currentStep;
      const userId = ctx.from?.id;

      if (!name || !userId || !productId) {
        await ctx.reply('❌ Xatolik yuz berdi.');
        this.step.delete(userId);
        return;
      }

      if (isNaN(newPrice) || newPrice <= 0) {
        await ctx.reply('❌ Narx noto‘g‘ri. Masalan: 10000');
        return;
      }

      const product = await this.productService.GetByIdProduct(productId);
      if (!product) {
        await ctx.reply('❌ Mahsulot topilmadi.');
        this.step.delete(userId);
        return;
      }

      await this.productService.updateProduct(productId, {
        name,
        unit_price: newPrice,
      });

      await ctx.reply(
        `✅ Mahsulot yangilandi:\n📦 ${name}\n💰 ${newPrice} so‘m`,
      );

      this.step.delete(userId);
      return;
    }

    if (currentStep?.step === 'awaiting_worker_name') {
      const fullName = text.trim();
      const userId = ctx.from?.id;

      if (!fullName || !userId) {
        await ctx.reply('❌ FIO noto‘g‘ri. Qaytadan urinib ko‘ring.');
        this.step.delete(userId);
        return;
      }

      this.step.set(userId, {
        step: 'awaiting_worker_telegram_id',
        fullName,
      });

      await ctx.reply('📱 Endi ishchining Telegram ID raqamini kiriting:');
      return;
    }

    if (currentStep?.step === 'awaiting_worker_telegram_id') {
      const telegramId = parseInt(text.trim());
      const { fullName } = currentStep;
      const userId = ctx.from?.id;

      if (!fullName || !userId) {
        await ctx.reply('❌ Maʼlumotlar yo‘qoldi. Qaytadan urinib ko‘ring.');
        this.step.delete(userId);
        return;
      }

      if (isNaN(telegramId) || telegramId <= 0) {
        await ctx.reply('❌ Telegram ID noto‘g‘ri. Masalan: 123456789');
        return;
      }

      this.step.set(userId, {
        step: 'awaiting_worker_phone',
        fullName,
        telegramId,
      });

      await ctx.reply(
        '📞 Ishchining telefon raqamini kiriting (masalan: +998901234567):',
      );
      return;
    }

    if (currentStep?.step === 'awaiting_worker_phone') {
      const phone = text.trim();
      const { fullName, telegramId } = currentStep;
      const userId = ctx.from?.id;

      if (!phone || !fullName || !telegramId || !userId) {
        await ctx.reply(
          '❌ Maʼlumotlar yetarli emas. Qaytadan urinib ko‘ring.',
        );
        this.step.delete(userId);
        return;
      }

      await this.userService.create({
        full_name: fullName,
        telegram_id: telegramId,
        phone_number: phone,
      });

      await ctx.reply(
        `✅ Yangi ishchi qo‘shildi:\n👤 ${fullName}\n🆔 ${telegramId}\n📞 ${phone}`,
      );

      this.step.delete(userId);
      return;
    }

    await ctx.reply('❗️ Nomaʼlum buyruq. Iltimos, to‘g‘ri amalni tanlang.');
  }

  async isAdmin(telegramId: number): Promise<boolean> {
    const admin = await this.userRepo.findOne({
      where: { telegramId, role: 'admin' },
    });
    return !!admin;
  }
}
