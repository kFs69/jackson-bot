const discord = require('discord.js');
const client = new discord.Client();
const ytdl = require('ytdl-core')
const streamOptions = { seek: 0, volume: 1 };
var PREFIX = '>';

const isValidCommand = (msg, cmdName) => msg.content.toLowerCase().startsWith(PREFIX + cmdName); 
const rollDice = () => Math.floor(Math.random() * 6) + 1;
client.on('ready', () => {
  console.log(`${client.user.tag} logged`)
})

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

client.on('message', msg => {
  if(isValidCommand(msg, 'play')) {
    let link = msg.content.substring(6);
    let voiceChannel = msg.member.voice.channel;
    let hasChannel = msg.guild.channels.cache.find(channel => channel.id === voiceChannel.id);

    if(!hasChannel) {
      msg.channel.send('Canal não encontrado');
    } else {
      voiceChannel.join()
      .then(conn => {
        const stream = ytdl(link, { filter: 'audioonly' });
        const DJ = conn.play(stream, streamOptions);
      })
      .catch(err => console.error(err));
    }
  }
})

client.login('NDg1MjI2OTI3OTM4ODYzMTA1.Xj8WFA.Lfe9IIlC-etr2F8KnhVuGe7u26A');