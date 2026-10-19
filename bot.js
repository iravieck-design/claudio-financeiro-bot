// Cláudio | Financeiro LOOP — bot de script do WorkAdventure.
// Ouve o chat da bolha, manda cada mensagem para a planilha (Apps Script) e responde.
// Endereço e chave ficam fora deste arquivo. No WorkAdventure, em "Custom hash parameters":
//   api=URL_DO_APP_DA_WEB_CODIFICADA&token=SUA_CHAVE

const OI = 'Oi! Sou o Cláudio, do financeiro. Me conte os gastos e recebimentos do dia, por exemplo: ' +
  '"paguei 85 de almoço no pix" ou "recebi 1.200 do cliente Acme". Também respondo "qual o saldo de hoje?".';

async function run(metadata) {
  console.log('Cláudio: iniciando', metadata);
  try { await WA.onInit(); } catch (e) { console.log('Cláudio: onInit falhou', e); }
  const hash = WA.room.hashParameters || {};
  const api = decodeURIComponent(hash.api || '');
  const token = hash.token;
  console.log('Cláudio: api configurada?', !!api, 'token?', !!token);
  const bolha = { scope: 'bubble' };
  const dizer = (t) => WA.chat.sendChatMessage(t, bolha);

  WA.player.proximityMeeting.onJoin().subscribe(() => dizer(OI));

  WA.chat.onChatMessage(async (mensagem, evento) => {
    if (!evento || !evento.author) return; // ignora as próprias mensagens
    console.log('Cláudio: mensagem de', evento.author.name);
    if (!api || !token) { dizer('Estou sem a configuração da planilha. Peça para ajustar os parâmetros do bot.'); return; }
    WA.chat.startTyping(bolha);
    try {
      const r = await fetch(api, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // evita preflight de CORS no Apps Script
        body: JSON.stringify({ token, texto: mensagem, autor: evento.author.name || '' }),
      });
      const j = await r.json();
      if (j.resposta) dizer(j.resposta);
    } catch (e) {
      console.log('Cláudio: erro ao falar com a planilha', e);
      dizer('Não consegui falar com a planilha agora. Tente de novo em instantes.');
    } finally {
      WA.chat.stopTyping(bolha);
    }
  }, bolha);

  console.log('Cláudio: pronto');
  await new Promise(() => {}); // mantém o bot vivo: se run() terminar, o WorkAdventure encerra o bot
}

// O WorkAdventure chama o run() do export default.
export default { run };
