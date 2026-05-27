const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    SlashCommandBuilder,
    REST,
    Routes
} = require('discord.js');

require('dotenv').config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// =======================
// SLASH COMMANDS SETUP
// =======================

const commands = [
    new SlashCommandBuilder().setName('intro').setDescription('HR introduction'),
    new SlashCommandBuilder().setName('report').setDescription('Send filing report'),
    new SlashCommandBuilder().setName('vc').setDescription('VC policy message'),
    new SlashCommandBuilder().setName('interview').setDescription('Start interview panel'),
    new SlashCommandBuilder()
        .setName('dm')
        .setDescription('DM a user (HR only)')
        .addUserOption(option =>
            option.setName('user').setDescription('User').setRequired(true)
        )
        .addStringOption(option =>
            option.setName('message').setDescription('Message').setRequired(true)
        )
];

// Register commands
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
    console.log('Certamen HR Bot is online.');

    await rest.put(
        Routes.applicationCommands(client.user.id),
        { body: commands }
    );
});

// =======================
// BUTTON INTERVIEW PANEL bj
// =======================

function interviewPanel() {
    const embed = new EmbedBuilder()
        .setColor('#ffffff')
        .setTitle('Certamen Studios — Interview Panel')
        .setDescription('Choose an action below to manage applicant.');

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('accept')
            .setLabel('Accept')
            .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
            .setCustomId('reject')
            .setLabel('Reject')
            .setStyle(ButtonStyle.Danger),

        new ButtonBuilder()
            .setCustomId('note')
            .setLabel('Add Note')
            .setStyle(ButtonStyle.Secondary)
    );

    return { embed, row };
}

// =======================
// INTERACTIONS
// =======================

client.on('interactionCreate', async interaction => {

    // SLASH COMMANDS
    if (interaction.isChatInputCommand()) {

        // INTRO
        if (interaction.commandName === 'intro') {
            const embed = new EmbedBuilder()
                .setColor('#ffffff')
                .setTitle('HR Interview')
                .setDescription(`
Hello,

My name is Arya, and I will be your interviewer today.
I am part of the HR Department at Certamen Studios.

We prefer voice interviews with portfolio presentation.
                `);

            return interaction.reply({ embeds: [embed] });
        }

        // REPORT
        if (interaction.commandName === 'report') {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#ffffff')
                        .setTitle('Report')
                        .setDescription('Submitted to Filing Department.')
                ]
            });
        }

        // VC POLICY
        if (interaction.commandName === 'vc') {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#ffffff')
                        .setTitle('VC Required')
                        .setDescription('Voice interviews are mandatory.')
                ]
            });
        }

        // INTERVIEW PANEL
        if (interaction.commandName === 'interview') {
            const panel = interviewPanel();
            return interaction.reply({
                embeds: [panel.embed],
                components: [panel.row]
            });
        }

        // DM COMMAND (ADMIN CONTROLLED)
        if (interaction.commandName === 'dm') {

            const user = interaction.options.getUser('user');
            const msg = interaction.options.getString('message');

            const embed = new EmbedBuilder()
                .setColor('#ffffff')
                .setTitle('Certamen Studios HR')
                .setDescription(msg);

            try {
                await user.send({ embeds: [embed] });
                return interaction.reply('DM sent successfully.');
            } catch {
                return interaction.reply('User has DMs disabled.');
            }
        }
    }

    // BUTTON SYSTEM
    if (interaction.isButton()) {

        if (interaction.customId === 'accept') {
            return interaction.reply({
                content: 'Applicant marked as ACCEPTED ✅',
                ephemeral: true
            });
        }

        if (interaction.customId === 'reject') {
            return interaction.reply({
                content: 'Applicant marked as REJECTED ❌',
                ephemeral: true
            });
        }

        if (interaction.customId === 'note') {
            return interaction.reply({
                content: 'Note system not yet connected (next upgrade)',
                ephemeral: true
            });
        }
    }
});

client.login(process.env.TOKEN);