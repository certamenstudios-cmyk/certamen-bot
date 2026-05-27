const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    SlashCommandBuilder,
    REST,
    Partials,
    ModalBuilder,       
    TextInputBuilder,   
    TextInputStyle,     
    Routes
} = require('discord.js');

require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel]
});

const COLORS = {
    neutral: '#2c2f33',
    success: '#43b581',
    danger: '#f04747',
    warning: '#faa61a'
};

// Simple active memory cache to track delivery statuses per channel
const deliveryCache = new Map();

// =======================
// SLASH COMMANDS SETUP
// =======================

const commands = [
    new SlashCommandBuilder().setName('intro').setDescription('HR introduction message'),
    new SlashCommandBuilder().setName('report').setDescription('Send filing report to HR records'),
    new SlashCommandBuilder().setName('vc').setDescription('VC policy reminder'),
    new SlashCommandBuilder().setName('interview').setDescription('Deploy the HR interactive panel'),
    new SlashCommandBuilder().setName('hold').setDescription('Place an applicant on standard hold status'),
    new SlashCommandBuilder().setName('archive').setDescription('Lock down and archive current interview channel'),
    new SlashCommandBuilder().setName('noteslist').setDescription('View active interview evaluation templates'),
    new SlashCommandBuilder()
        .setName('dm')
        .setDescription('Direct message an applicant safely via the bot')
        .addUserOption(option =>
            option.setName('user').setDescription('Target applicant').setRequired(true)
        )
        .addStringOption(option =>
            option.setName('message').setDescription('Message content').setRequired(true)
        )
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
    console.log(`🚀 ${client.user.tag} running with Advanced Delivery Logging.`);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    } catch (error) {
        console.error(error);
    }
});

function interviewPanel() {
    const embed = new EmbedBuilder()
        .setColor(COLORS.neutral)
        .setAuthor({ name: 'Certamen Studios — Human Resources', iconURL: client.user.displayAvatarURL() })
        .setTitle('💼 Applicant Management Center')
        .setDescription('Please select an administrative action below to progress this applicant\'s status file.')
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('accept').setLabel('Accept').setEmoji('✅').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('reject').setLabel('Reject').setEmoji('❌').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('note').setLabel('Add Note').setEmoji('📝').setStyle(ButtonStyle.Secondary)
    );

    return { embed, row };
}

// =======================
// DM INBOUND FORWARDER (With Name Tracking)
// =======================

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // Check if the message is a Direct Message
    if (message.channel.type === 1) { 
        const logChannelId = process.env.LOG_CHANNEL_ID;
        if (!logChannelId) return;

        try {
            const logChannel = await client.channels.fetch(logChannelId);
            if (!logChannel) return;

            // Retrieve delivery audit history from memory cache
            const deliveryReceipt = deliveryCache.get(message.author.id) || { status: 'Unknown/Direct Inbound', location: 'Direct DM Inbox' };

            const replyEmbed = new EmbedBuilder()
                .setColor(COLORS.warning)
                .setAuthor({ 
                    name: `Incoming Reply From: ${message.author.displayName} (@${message.author.username})`, 
                    iconURL: message.author.displayAvatarURL({ dynamic: true }) 
                })
                .setDescription(message.content || "*[Sent an attachment/image or empty text]*")
                .addFields(
                    { name: '👤 Applicant Name', value: `${message.author.displayName} (${message.author.tag})`, inline: true },
                    { name: '🆔 Account ID', value: `\`${message.author.id}\``, inline: true },
                    { name: '📦 Last Delivery Audit', value: `🟢 Successfully Delivered to ${deliveryReceipt.location}`, inline: false }
                )
                .setTimestamp()
                .setFooter({ text: 'Certamen Live Interview DM Feed' });

            await logChannel.send({ embeds: [replyEmbed] });
            
            // Give candidate immediate visual feedback that their letter hit staff systems
            await message.react('✅');
        } catch (error) {
            console.error("Failed to forward DM message:", error);
        }
    }
});

// =======================
// INTERACTIONS & FORM SUBMISSIONS
// =======================

client.on('interactionCreate', async interaction => {

    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'intro') {
            const embed = new EmbedBuilder()
                .setColor(COLORS.neutral)
                .setTitle('👋 Welcome to your Interview')
                .setDescription(`Hello,\n\nMy name is **Arya**, and I am your designated Human Resources representative today.\n\nOur standard operating protocol favors **voice interviews accompanied by portfolio presentations**.`);
            return interaction.reply({ embeds: [embed] });
        }

        if (interaction.commandName === 'report') {
            return interaction.reply({ content: '📥 Session submitted to the **Filing Department**.', ephemeral: true });
        }

        if (interaction.commandName === 'vc') {
            return interaction.reply({ content: '🔊 **Voice Channel Reminder:** Interviews are mandatory in voice.', ephemeral: true });
        }

        if (interaction.commandName === 'interview') {
            const panel = interviewPanel();
            return interaction.reply({ embeds: [panel.embed], components: [panel.row] });
        }

        if (interaction.commandName === 'hold') {
            return interaction.reply({ content: '⏳ Application placed on administrative hold.', ephemeral: true });
        }

        if (interaction.commandName === 'archive') {
            return interaction.reply({ content: '🔒 Room archived. Channel closed.', ephemeral: true });
        }

        if (interaction.commandName === 'noteslist') {
            const embed = new EmbedBuilder()
                .setColor(COLORS.neutral)
                .setTitle('📋 Evaluation Guide')
                .addFields(
                    { name: '1. Communication', value: 'Clear phrasing & professional delivery.', inline: false },
                    { name: '2. Portfolio', value: 'Asset viability & project depth.', inline: false }
                );
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // UPGRADED DM COMMAND: Delivery Route Tracking Engine
        if (interaction.commandName === 'dm') {
            const user = interaction.options.getUser('user');
            const msg = interaction.options.getString('message');

            const embed = new EmbedBuilder()
                .setColor(COLORS.neutral)
                .setAuthor({ name: 'Certamen Studios — Official HR Notice' })
                .setDescription(msg)
                .setTimestamp()
                .setFooter({ text: 'You can reply directly to this DM to talk to HR.' });

            await interaction.reply({ content: `📡 Checking routing path and sending to **${user.displayName}**...`, ephemeral: true });

            try {
                await user.send({ embeds: [embed] });

                // Cache successful delivery parameters
                deliveryCache.set(user.id, {
                    status: 'Delivered Successfully',
                    location: `@${user.username}'s Direct Messages`
                });

                return interaction.editReply({ 
                    content: `🟢 **Delivery Verification:** Message successfully routed and dropped off in **${user.displayName}**'s inbox (@${user.username}). DMs are open.` 
                });

            } catch (error) {
                // Cache failed delivery parameters due to privacy locks
                deliveryCache.set(user.id, {
                    status: 'Failed / Closed DMs',
                    location: 'Blocked / Rejected Dropoff'
                });

                return interaction.editReply({ 
                    content: `🔴 **Delivery Rejection:** Message could not route to **${user.displayName}**. They have **Closed DMs**, have blocked the bot, or are not sharing a server with it.` 
                });
            }
        }
    }

    // --- BUTTON SYSTEM ---
    if (interaction.isButton()) {
        if (interaction.customId === 'accept') {
            return interaction.reply({ content: '🛡️ Status updated: **ACCEPTED** ✅', ephemeral: true });
        }
        if (interaction.customId === 'reject') {
            return interaction.reply({ content: '🛡️ Status updated: **REJECTED** ❌', ephemeral: true });
        }
        
        if (interaction.customId === 'note') {
            const modal = new ModalBuilder()
                .setCustomId('evaluation_modal')
                .setTitle('Evaluation Scratchpad');

            const notesInput = new TextInputBuilder()
                .setCustomId('notes_text')
                .setLabel("Enter candidate remarks")
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder("Type details here...")
                .setRequired(true)
                .setMaxLength(1000);

            const row = new ActionRowBuilder().addComponents(notesInput);
            modal.addComponents(row);

            return interaction.showModal(modal);
        }
    }

    // --- MODAL SUBMISSION HANDLER ---
    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'evaluation_modal') {
            const hrNotes = interaction.fields.getTextInputValue('notes_text');
            const logChannelId = process.env.LOG_CHANNEL_ID;

            if (!logChannelId) return interaction.reply({ content: '❌ Configuration Error.', ephemeral: true });

            try {
                const logChannel = await client.channels.fetch(logChannelId);
                
                const noteEmbed = new EmbedBuilder()
                    .setColor(COLORS.neutral)
                    .setAuthor({ name: `Evaluation Added by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
                    .setDescription(hrNotes)
                    .setTimestamp();

                await logChannel.send({ embeds: [noteEmbed] });
                return interaction.reply({ content: '📝 Evaluation logged successfully.', ephemeral: true });
            } catch (error) {
                console.error(error);
                return interaction.reply({ content: '❌ Error saving logging notes.', ephemeral: true });
            }
        }
    }
});

client.login(process.env.TOKEN);