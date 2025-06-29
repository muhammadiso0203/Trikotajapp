import { Injectable } from '@nestjs/common';
import { Start, Ctx, On, Action, Update } from 'nestjs-telegraf';
import { ProductService } from 'src/Service/product.service';
import { UserService } from 'src/Service/user.service';
import { Context, Markup } from 'telegraf';
import { Update as TgRawUpdate } from 'telegraf/typings/core/types/typegram';
import { getAdminPanel } from './admin.panel';

@Update()
@Injectable()
export class BotService {
  private step = new Map<number, any>();

  constructor(
    private readonly userService: UserService,
    private readonly productService: ProductService,
  ) {}

  @Start()
  async onStart(@Ctx() ctx: Context) {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const user = await this.userService.getByTelegramId(telegramId);

    if (user && user.phone_number) {
      // ✅ Telefon raqami bor — tugmani chiqarish shart emas
      await ctx.reply(
        `👋 Xush kelibsiz, ${user.full_name || 'foydalanuvchi'}!`,
      );
      await this.sendMainMenu(ctx); // 🔘 Asosiy tugmalar
      return;
    }

    // 🚨 Telefon raqami yo'q — tugmani chiqaramiz
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

    // ❗️callbackQuery va data mavjudligini tekshiramiz
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
    await ctx.reply('📊 Statistikangiz tez orada shu yerda ko‘rsatiladi.');
  }

  @Action('MY_SALARY')
  async handleMySalary(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();
    await ctx.reply('💰 Oylik maoshingiz tez orada shu yerda ko‘rsatiladi.');
  }

  @Action('OPEN_ADMIN_PANEL')
  async openAdminPanel(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();
    await ctx.reply('🛠 Admin panelga xush kelibsiz:', getAdminPanel());
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

  @On('text')
  async handleText(@Ctx() ctx: Context) {
    const userId = ctx.from?.id;
    const message = ctx.message as any;

    if (!message?.text || !userId) return;

    const text = message.text;

    // 🛠 Admin panel ochuvchi buyruq
    if (text === '/admin') {
      await ctx.reply('🛠 Admin panelga xush kelibsiz:', getAdminPanel());
    }

    // 👇 Quyida stepga qarab mahsulot nomi qabul qilinadi
    const currentStep = this.step.get(userId);
    if (currentStep?.step === 'awaiting_new_product_name') {
      const productName = text;

      await this.productService.createProduct({
          name: productName,
          unit_price: 0,
          description: ''
      });

      await ctx.reply(
        `✅ "${productName}" nomli mahsulot muvaffaqiyatli qo‘shildi!`,
      );

      this.step.delete(userId);
    }
  }
}
