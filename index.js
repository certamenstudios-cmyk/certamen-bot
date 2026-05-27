const {
    Client,
    GatewayIntentBits,
    EmbedBuilder
} = require('discord.js');

require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ]
});

client.once('ready', async () => {

    console.log('Certamen HR Bot is online.');

    const commands = [
        {
            name: 'intro',
            description: 'Send HR introduction'
        },
        {
            name: 'report',
            description: 'Send filing report'
        },
        {
            name: 'vc',
            description: 'Send VC policy'
        }
    ];

    await client.application.commands.set(commands);

});

client.on('interactionCreate', async interaction => {

    if (!interaction.isChatInputCommand()) return;

    // INTRO
    if (interaction.commandName === 'intro') {

        const embed = new EmbedBuilder()
            .setColor('#ffffff')
            .setTitle('Certamen Studios — HR Interview')
            .setDescription(`
Hello,

My name is Arya, and I will be your interviewer today.
I am part of the HR Department at Certamen Studios.

We prefer interviews to be conducted via voice call.

Best regards,
HR Department
Certamen Studios
            `);

        await interaction.reply({
            embeds: [embed]
        });
    }

    // REPORT
    if (interaction.commandName === 'report') {

        const embed = new EmbedBuilder()
            .setColor('#ffffff')
            .setTitle('Interview Report')
            .setDescription(`
Your answers have been submitted to the Filing Department.
            `);

        await interaction.reply({
            embeds: [embed]
        });
    }

    // VC POLICY
    if (interaction.commandName === 'vc') {

        const embed = new EmbedBuilder()
            .setColor('#ffffff')
            .setTitle('Voice Interview Requirement')
            .setDescription(`
Voice interviews are required for this recruitment process.
            `);

        await interaction.reply({
            embeds: [embed]
        });
    }

});

client.login(process.env.TOKEN);