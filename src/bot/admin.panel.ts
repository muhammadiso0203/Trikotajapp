import { Markup } from 'telegraf';

export function getAdminPanel() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('➕ Mahsulot qo‘shish', 'ADD_NEW_PRODUCT')],
  ]);

  
}
