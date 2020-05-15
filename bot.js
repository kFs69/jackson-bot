const discord = require('discord.js');
const client = new discord.Client();
const ytdl = require('ytdl-core');
const axios = require('axios');
const streamOptions = { seek: 0, volume: 1 };
var PREFIX = '>';

var servers = {};

const moeda = (msg, moeda) => {
  let url = 'https://api.hgbrasil.com/finance';

  axios.get(url)
  .then(res => {
    let cotacao = res.data.results.currencies[moeda];

    let variation = cotacao.variation;
    let buy = cotacao.buy;
    let sell = cotacao.sell;

    buy = buy.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    sell = sell.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    variation = variation < 1 ? `${cotacao.variation}% ↓` : `${cotacao.variation}% ↑`;

    let embed = new discord.MessageEmbed();
    embed.addFields(
      { name: 'Compra', value: buy, inline: true },
      { name: 'Venda', value: sell, inline: true },
      { name: 'Variação', value: variation, inline: true },
    )
    embed.setColor('#63d6ff');
    embed.setTitle(`Cotação ${cotacao.name}!`);
    embed.setTimestamp();

    msg.channel.send(embed);
  })
  .catch(err => console.error(err));
}

const usersMap = new Map();
const LIMIT = 10;
const TIME = 10000;
const DIFF = 10000;

const isValidCommand = (msg, cmdName) => msg.content.toLowerCase().startsWith(PREFIX + cmdName); 
const rollDice = () => Math.floor(Math.random() * 6) + 1;
client.on('ready', () => {
  client.user.setPresence({ activity: { name: 'Developed by kFs' }, status: 'online' });
  console.log(`${client.user.tag} logged`)
})

client.on('message', msg => {
  if(usersMap.has(msg.author.id)) {
    const userData = usersMap.get(msg.author.id);
    const { lastMessage, timer } = userData;
    const difference = msg.createdTimestamp - lastMessage.createdTimestamp;
    let msgCount = userData.msgCount;
    if(difference > DIFF) {
      clearTimeout(timer);
      console.log('Cleared timeout');
      userData.msgCount = 1;
      userData.lastMessage = msg;
      userData.timer = setTimeout(() => {
        usersMap.delete(msg.author.id);
        console.log('Removed from RESET.');
      }, TIME);
      usersMap.set(msg.author.id, userData);
    } else {
      ++msgCount;
      console.log(msgCount)
      if(parseInt(msgCount) === LIMIT) {
        const role = msg.guild.roles.cache.get('697588214927720568');
        msg.member.roles.add(role);
        msg.channel.send(`${msg.author.username} foi mutado por 10seg!`);
        setTimeout(() => {
          msg.member.roles.remove(role);
          msg.channel.send(`${msg.author.username} foi desmutado!`);
        }, TIME);
      } else {
        msgCount++;
        userData.msgCount = msgCount;
        usersMap.set(msg.author.id, userData);
      }
    }
  } else {
    let fn = setTimeout(() => {
      usersMap.delete(msg.author.id);
      console.log('Removed from map');
    }, TIME);

    usersMap.set(msg.author.id, {
      msgCount: 1,
      lastMessage: msg,
      timer: fn
    });
  }
})

client.on('message', msg => {
  if(isValidCommand(msg, 'embed')) {
    let guild = msg.guild;
    let member = msg;
    let membercount = client.users.size;

    let embed = new discord.MessageEmbed();
    embed.setDescription('Dê as boas vindas a ele!');
    embed.setColor('#63d6ff');
    embed.setTitle(`${member.nickname} entrou!`);
    embed.setTimestamp();
    msg.channel.send(embed);
  }
})

client.on('guildMemberAdd', member => {
  let channel = member.guild.channels.cache.get('675475431947763712');
  // let role = member.guild.roles.cache.get('698989384309145751');
  let bemvindo = member.guild.channels.cache.get('475805784408850442');
  let regras = member.guild.channels.cache.get('675476785961500683');

  let embed = new discord.MessageEmbed();
  embed.setDescription(`Bem vindo(a), Vá até o ${bemvindo} para iniciar, leia as ${regras} e mantenha um bom relacionamento com o pessoal!`);
  embed.setColor('#63d6ff');
  embed.setTitle(`${member.user.username} entrou!`);
  embed.setTimestamp();
  embed.setThumbnail(member.user.displayAvatarURL());
  embed.setFooter('Data de entrada');

  // member.roles.add(role);
  channel.send(embed);
})

// client.on('guildMemberRemove', member => {
//   let channel = member.guild.channels.cache.get('704079436961546310');

//   let embed = new discord.MessageEmbed();
//   embed.setDescription('Acho que ele não se garante na porrada!');
//   embed.setColor('#63d6ff');
//   embed.setTitle(`${member.user.username} saiu!`);
//   embed.setTimestamp();
//   embed.setThumbnail(member.user.displayAvatarURL());
//   embed.setFooter('Data da saida');

//   channel.send(embed);
// })

client.on('message', msg => {
  if(msg.author.bot) return;
  if(isValidCommand(msg, 'ping')) {
    msg.reply('pong');
  }
})

client.on('message', msg => {
  if(isValidCommand(msg, 'rolldice')) {
    msg.reply(`${rollDice()}`);
  }
})

client.on('message', async msg => {
  if(isValidCommand(msg, 'bitcoin')) {
    moeda(msg, 'BTC');
  }
})

client.on('message', async msg => {
  if(isValidCommand(msg, 'dolar')) {
    moeda(msg, 'USD');
  }
})

client.on('message', async msg => {
  if(isValidCommand(msg, 'euro')) {
    moeda(msg, 'EUR');
  }
})

client.on('message', msg => {
  if(isValidCommand(msg, 'play')) {
    const play = (connection, msg) => {
      var server = servers[msg.guild.id];

      server.dispatcher = connection.play(ytdl(server.queue[0], { filter: 'audioonly' }));

      server.queue.shift();

      server.dispatcher.on('end', () => {
        if(server.queue[0]) {
          play(connection, msg);
        } else {
          connection.disconnect();
        }
      })
    }

    let link = msg.content.substring(6);

    if(!link) {
      return msg.channel.send('Você precisa providenciar um link!');
    }

    let voiceChannel = msg.member.voice.channel;

    if(!voiceChannel) {
      return msg.channel.send('Entre em algum canal de voz');
    } 

    let hasChannel = msg.guild.channels.cache.find(channel => channel.id === voiceChannel.id);

    if(!hasChannel) return msg.channel.send('Canal não encontrado');

    if(!servers[msg.guild.id]) servers[msg.guild.id] = { queue: [] };
      
    var server = servers[msg.guild.id];

    server.queue.push(link);

    if(!voiceChannel.members.get(client.user.id)) {
      return msg.member.voice.channel.join().then(connection => {
        play(connection, msg);
      })
    }
  }
})

client.on('message', msg => {
  if(isValidCommand(msg, 'skip')){
    var server = servers[msg.guild.id];
    if(server.dispatcher) server.dispatcher.end();
    console.log(server);
    msg.channel.send('Pulando a música!');
  }
})

client.on('message', msg => {
  if(isValidCommand(msg, 'stop')){
    var server = servers[msg.guild.id];
    if(msg.guild.voice.connection) {
      for(var i = server.queue.length - 1; i>=0; i--) {
        server.queue.splice(i, 1);
      }

      server.dispatcher.end();
      msg.channel.send('Parando a musica e saindo do canal de voz!');
      console.log('Parando a queue!');
    }

    msg.guild.voice.connection.disconnect();
  }
})

client.login('NDg1MjI2OTI3OTM4ODYzMTA1.Xj8WFA.Lfe9IIlC-etr2F8KnhVuGe7u26A');