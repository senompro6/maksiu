const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const GoalXZ = goals.GoalXZ;
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => { 
  console.log('=> Ktoś (lub UptimeRobot) odwiedził stronę WWW bota!');
  res.send('maksiu zyje i dziala!'); 
});
app.listen(PORT, () => { console.log(`Serwer HTTP ruszył na porcie ${PORT}`); });

let czyZarejestrowany = false;
let naAnarchii = false;

function stworzBota() {
  console.log('=== URUCHAMIAM PROCEDURĘ LOGOWANIA DO MINECRAFT ===');
  console.log('Próba połączenia z craftmc.pl na nick maksiu...');
  
  const bot = mineflayer.createBot({
    host: 'craftmc.pl',
    port: 25565,
    username: 'maksiu',
    version: '1.20.4',
    connectTimeout: 30000 // Zwiększony czas oczekiwania na odpowiedź serwera
  });

  bot.loadPlugin(pathfinder);

  bot.once('spawn', () => {
    console.log('!!! SUKCES: maksiu wszedł fizycznie na serwer !!!');
    setTimeout(() => {
      if (!czyZarejestrowany) {
        console.log('Wysyłam: /register cwel cwel');
        bot.chat('/register cwel cwel');
        czyZarejestrowany = true;
      } else {
        console.log('Wysyłam: /login cwel');
        bot.chat('/login cwel');
        setTimeout(() => { idzIKliknijKompas(bot); }, 4000);
      }
    }, 3000);
  });

  bot.on('chat', (username, message) => {
    if (username === bot.username) return; 
    console.log(`[CZAT] <${username}> ${message}`);
  });

  bot.on('message', (jsonMsg) => {
    const tekst = jsonMsg.toString().trim();
    if (!tekst) return; 
    if (tekst.startsWith('<') && tekst.includes('>')) return; 
    console.log(`[SERWER] ${tekst}`);
  });

  bot.on('windowOpen', async (window) => {
    console.log('Wykryto otwarte menu GUI. Szukam jabłka...');
    const slotJabłka = window.slots.findIndex((item, index) => {
      return item && item.name === 'apple' && index < window.inventoryStart;
    });
    if (slotJabłka !== -1) {
      console.log(`Klikam czerwone jabłko na slocie: ${slotJabłka}`);
      await bot.clickWindow(slotJabłka, 0, 0);
    }
  });

  bot.on('respawn', () => {
    if (!naAnarchii) {
      naAnarchii = true;
      setTimeout(() => { bot.chat('/rtp'); }, 3000);
    }
  });

  bot.on('kicked', (reason) => {
    console.log(`!!! BOT WYRZUCONY Z SERWERA (KICK) !!! Powód: ${reason}`);
    naAnarchii = false;
    console.log('Restart bota za 10 sekund...');
    setTimeout(stworzBota, 10000);
  });

  // ROZBUDOWANA OBSŁUGA BŁĘDÓW SIECIOWYCH
  bot.on('error', (err) => {
    console.log('!!! WYSTĄPIŁ BŁĄD POŁĄCZENIA Z SERWEREM MINECRAFT !!!');
    if (err.code === 'ECONNREFUSED') {
      console.log('Błąd: Serwer Minecraft odrzucił połączenie (IP Rendera zablokowane/Anty-DDoS).');
    } else if (err.code === 'ETIMEDOUT') {
      console.log('Błąd: Przekroczono czas połączenia. Serwer nie odpowiada hostingowi.');
    } else {
      console.log('Szczegóły błędu:', err.message);
    }
    console.log('Próba ponownego uruchomienia za 15 sekund...');
    setTimeout(stworzBota, 15000);
  });
}

stworzBota();

