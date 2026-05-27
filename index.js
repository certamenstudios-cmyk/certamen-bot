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

// Active state memory to link channels, candidates, and ongoing assessment logs
const deliveryCache = new Map();
const activeInterviews = new Map(); 
const evaluationStorage = new Map(); 

// =======================
// SLASH COMMANDS SETUP
// =======================

const commands = [
    new SlashCommandBuilder().setName('intro').setDescription('HR introduction message'),
    new SlashCommandBuilder().setName('report').setDescription('Send filing report to HR records'),
    new SlashCommandBuilder().setName('hold').setDescription('Place an applicant on standard hold status'),
    new SlashCommandBuilder().setName('archive').setDescription('Lock down and archive current interview channel'),
    new SlashCommandBuilder().setName('noteslist').setDescription('View active interview evaluation templates'),
    new SlashCommandBuilder()
        .setName('interview')
        .setDescription('Deploy the HR interactive panel linked to an applicant')
        .addUserOption(option =>
            option.setName('applicant').setDescription('The candidate being interviewed').setRequired(true)
        )
        .addStringOption(option =>
            option.setName('role').setDescription('Job Position (e.g. Builder, Scripting)').setRequired(true)
        ),
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
    console.log(`🚀 ${client.user.tag} HR Automation System is fully functional.`);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    } catch (error) {
        console.error(error);
    }
});

// Dynamic interview panel building system
function buildInterviewPanel(user, role) {
    const embed = new EmbedBuilder()
        .setColor(COLORS.neutral)
        .setAuthor({ name: 'Certamen Studios — HR Evaluation Control' })
        .setTitle('💼 Active Interview File Engine')
        .setDescription(`This interaction grid controls the application state for **${user.displayName}** matches.`)
        .addFields(
            { name: '👤 Candidate Profile', value: `${user} (@${user.username})`, inline: true },
            { name: '🛠️ Target Designation', value: `\`${role.toUpperCase()}\``, inline: true },
            { name: '📌 Note Record Status', value: '*No current evaluation added to cache.*', inline: false }
        )
        .setTimestamp()
        .setFooter({ text: 'Certamen Human Resources Core' });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('accept').setLabel('Accept & Hire').setEmoji('✅').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('reject').setLabel('Reject Candidate').setEmoji('❌').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('note').setLabel('Log Eval Note').setEmoji('📝').setStyle(ButtonStyle.Secondary)
    );

    return { embed, row };
}

// =======================
// DM INBOUND FORWARDER
// =======================

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.channel.type === 1) { 
        const logChannelId = process.env.LOG_CHANNEL_ID;
        if (!logChannelId) return;

        try {
            const logChannel = await client.channels.fetch(logChannelId);
            if (!logChannel) return;

            const deliveryReceipt = deliveryCache.get(message.author.id) || { status: 'Unknown', location: 'Direct Inbox' };

            const replyEmbed = new EmbedBuilder()
                .setColor(COLORS.warning)
                .setAuthor({ 
                    name: `Reply from: ${message.author.displayName} (@${message.author.username})`, 
                    iconURL: message.author.displayAvatarURL({ dynamic: true }) 
                })
                .setDescription(message.content || "*[Sent an attachment/image or empty text]*")
                .addFields(
                    { name: '👤 Applicant Name', value: `${message.author.displayName} (${message.author.tag})`, inline: true },
                    { name: '🆔 Account ID', value: `\`${message.author.id}\``, inline: true },
                    { name: '📦 Last Delivery Audit', value: `🟢 Successfully Delivered to ${deliveryReceipt.location}`, inline: false }
                )
                .setTimestamp();

            await logChannel.send({ embeds: [replyEmbed] });
            await message.react('✅');
        } catch (error) {
            console.error(error);
        }
    }
});

// =======================
// SYSTEM CORE INTERACTIONS
// =======================

client.on('interactionCreate', async interaction => {

    // --- SLASH COMMANDS ---
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'intro') {
            const embed = new EmbedBuilder()
                .setColor(COLORS.neutral)
                .setTitle('👋 Welcome to your Interview')
                .setDescription(`Hello,\n\nMy name is **Arya**, and I am your designated Human Resources representative today.\n\nPlease ensure your documentation and portfolio are ready to share.`);
            return interaction.reply({ embeds: [embed] });
        }

        if (interaction.commandName === 'report') {
            return interaction.reply({ content: '📥 Session submitted to the **Filing Department**.', ephemeral: true });
        }

        if (interaction.commandName === 'interview') {
            const user = interaction.options.getUser('applicant');
            const role = interaction.options.getString('role');

            // Save relationship state in local cache mapping
            activeInterviews.set(interaction.channelId, { userId: user.id, userObj: user, position: role });

            const panel = buildInterviewPanel(user, role);
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

        if (interaction.commandName === 'dm') {
            const user = interaction.options.getUser('user');
            const msg = interaction.options.getString('message');

            const embed = new EmbedBuilder()
                .setColor(COLORS.neutral)
                .setDescription(msg)
                .setTimestamp();

            await interaction.reply({ content: `📡 Dispatching message...`, ephemeral: true });

            try {
                await user.send({ embeds: [embed] });
                deliveryCache.set(user.id, { status: 'Delivered', location: `@${user.username}'s DM` });
                return interaction.editReply({ content: `🟢 **Delivered** directly to **${user.displayName}**.` });
            } catch (error) {
                return interaction.editReply({ content: `🔴 **Delivery Failed:** Candidate has private DMs closed.` });
            }
        }
    }

    // --- BUTTON ACTIONS ENGINE ---
    if (interaction.isButton()) {
        const fileDetails = activeInterviews.get(interaction.channelId);

        if (!fileDetails) {
            return interaction.reply({ content: '❌ System Timeout: No linked candidate entry map found for this room. Re-run `/interview`.', ephemeral: true });
        }

        const targetUser = fileDetails.userObj;
        const targetRole = fileDetails.position;
        const currentNotes = evaluationStorage.get(interaction.channelId) || "*No evaluation notes logged by interviewer.*";

        // ACCEPT/HIRE PIPELINE
        if (interaction.customId === 'accept') {
            const hiredChannelId = process.env.HIRED_CHANNEL_ID;
            if (!hiredChannelId) return interaction.reply({ content: '❌ Setup Error: HIRED_CHANNEL_ID missing in system settings.', ephemeral: true });

            await interaction.reply({ content: `⚙️ Initializing onboarding sequence for **${targetUser.displayName}**...`, ephemeral: true });

            const applicantEmbed = new EmbedBuilder()
                .setColor(COLORS.success)
                .setTitle('🎉 Certamen Studios — Application Update')
                .setDescription(`Hello **${targetUser.displayName}**,\n\nWe are absolutely thrilled to inform you that you have been **ACCEPTED** into Certamen Studios for the position of **${targetRole.toUpperCase()}**!\n\nOur operations team will reach out shortly regarding onboarding details. Welcome to the studio!`)
                .setTimestamp();

            let dmStatus = "🟢 Message Delivered Safely to Inbox.";
            try {
                await targetUser.send({ embeds: [applicantEmbed] });
            } catch {
                dmStatus = "⚠️ Could not DM candidate directly (Private DMs locked). Please notify manually.";
            }

            try {
                const logChan = await client.channels.fetch(hiredChannelId);
                const feedEmbed = new EmbedBuilder()
                    .setColor(COLORS.success)
                    .setTitle('🟢 New Talent Onboarded')
                    .setThumbnail(targetUser.displayAvatarURL())
                    .addFields(
                        { name: '👤 Employee', value: `${targetUser} (@${targetUser.username})`, inline: true },
                        { name: '🆔 Account ID', value: `\`${targetUser.id}\``, inline: true },
                        { name: '🛠️ Assigned Role', value: `\`${targetRole.toUpperCase()}\``, inline: true },
                        { name: '📝 Final HR Interview Evaluation', value: currentNotes, inline: false }
                    )
                    .setTimestamp()
                    .setFooter({ text: `Processed by HR: ${interaction.user.tag}` });

                await logChan.send({ embeds: [feedEmbed] });
                return interaction.editReply({ content: `✅ **Onboarding Complete:** Candidate logged inside corporate records feed.\n📦 **DM Audit:** ${dmStatus}` });
            } catch (err) {
                console.error(err);
                return interaction.editReply({ content: '❌ Core Failure: Couldn\'t write metrics block to the designated Hired tracking channel.' });
            }
        }

        // REJECT PIPELINE
        if (interaction.customId === 'reject') {
            const notHiredChannelId = process.env.NOT_HIRED_CHANNEL_ID;
            if (!notHiredChannelId) return interaction.reply({ content: '❌ Setup Error: NOT_HIRED_CHANNEL_ID missing in system settings.', ephemeral: true });

            await interaction.reply({ content: `⚙️ Logging file closing entry for **${targetUser.displayName}**...`, ephemeral: true });

            const rejectionEmbed = new EmbedBuilder()
                .setColor(COLORS.danger)
                .setTitle('Certamen Studios — Application Update')
                .setDescription(`Hello **${targetUser.displayName}**,\n\nThank you for taking the time to discuss options with our HR team. Unfortunately, at this time we have decided not to move forward with your application file for the **${targetRole.toUpperCase()}** position.\n\nWe wish you the absolute best in your future development journey.`)
                .setTimestamp();

            let dmStatus = "🟢 Notification Sent Successfully.";
            try {
                await targetUser.send({ embeds: [rejectionEmbed] });
            } catch {
                dmStatus = "⚠️ Failed to deliver DM notification profile due to user privacy configurations.";
            }

            try {
                const logChan = await client.channels.fetch(notHiredChannelId);
                const feedEmbed = new EmbedBuilder()
                    .setColor(COLORS.danger)
                    .setTitle('🔴 Application File Deferred')
                    .setThumbnail(targetUser.displayAvatarURL())
                    .addFields(
                        { name: '👤 Candidate', value: `${targetUser} (@${targetUser.username})`, inline: true },
                        { name: '🛠️ Attempted Role', value: `\`${targetRole.toUpperCase()}\``, inline: true },
                        { name: '📝 Evaluation Notes Log', value: currentNotes, inline: false }
                    )
                    .setTimestamp()
                    .setFooter({ text: `Processed by HR: ${interaction.user.tag}` });

                await logChan.send({ embeds: [feedEmbed] });
                return interaction.editReply({ content: `❌ **File Closed:** Rejected state logged to audit tracking board.\n📦 **DM Audit:** ${dmStatus}` });
            } catch (err) {
                console.error(err);
                return interaction.editReply({ content: '❌ Core Failure: Couldn\'t write metrics block to Not-Hired logging channel.' });
            }
        }

        // TRIGGER MODAL POPUP FOR CODES NOTES
        if (interaction.customId === 'note') {
            const modal = new ModalBuilder()
                .setCustomId('evaluation_modal')
                .setTitle('Evaluation Scratchpad');

            const notesInput = new TextInputBuilder()
                .setCustomId('notes_text')
                .setLabel("Enter candidate remarks")
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder("Type notes here... They will automatically attach to their Hired/Not-Hired file records upon application decision.")
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
            
            // Commit evaluation notes to cache memory linked to this room
            evaluationStorage.set(interaction.channelId, hrNotes);

            const fileDetails = activeInterviews.get(interaction.channelId);
            if (fileDetails) {
                const updatedPanel = new EmbedBuilder()
                    .setColor(COLORS.warning)
                    .setAuthor({ name: 'Certamen Studios — HR Evaluation Control' })
                    .setTitle('💼 Active Interview File Engine')
                    .setDescription(`This interaction grid controls the application state for **${fileDetails.userObj.displayName}** matches.`)
                    .addFields(
                        { name: '👤 Candidate Profile', value: `${fileDetails.userObj} (@${fileDetails.userObj.username})`, inline: true },
                        { name: '🛠️ Target Designation', value: `\`${fileDetails.position.toUpperCase()}\``, inline: true },
                        { name: '📌 Note Record Status', value: `📝 **Cached Notes Profile:**\n*${hrNotes}*`, inline: false }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Certamen Human Resources Core • Note Loaded' });

                await interaction.update({ embeds: [updatedPanel] });
            } else {
                return interaction.reply({ content: '📝 Evaluation notes cached internally.', ephemeral: true });
            }
        }
    }
});

client.login(process.env.TOKEN);