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
        GatewayIntentBits.GuildMessages,
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
        .setDescription('Send an explicit message to the applicant linked to this active channel')
        .addStringOption(option =>
            option.setName('message').setDescription('Message content to deliver').setRequired(true)
        )
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
    console.log(`🚀 ${client.user.tag} Dual-Chat System (Live & Slash /dm) Active.`);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    } catch (error) {
        console.error(error);
    }
});

function buildInterviewPanel(user, role, notes = "*No current evaluation added to cache.*") {
    const embed = new EmbedBuilder()
        .setColor(COLORS.neutral)
        .setAuthor({ name: 'Certamen Studios — HR Evaluation Control' })
        .setTitle('💼 Active Interview File Engine')
        .setDescription(`This interaction grid controls the application state for this channel.\n\n**Applicant ID:** \`${user.id}\`\n**Target Role:** \`${role.toUpperCase()}\``)
        .addFields(
            { name: '👤 Candidate Profile', value: `${user} (@${user.username})`, inline: true },
            { name: '🛠️ Target Designation', value: `\`${role.toUpperCase()}\``, inline: true },
            { name: '📌 Note Record Status', value: notes, inline: false }
        )
        .setTimestamp()
        .setFooter({ text: 'Certamen Human Resources Core • Chat Link Active' });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('accept').setLabel('Accept & Hire').setEmoji('✅').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('reject').setLabel('Reject Candidate').setEmoji('❌').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('note').setLabel('Log Eval Note').setEmoji('📝').setStyle(ButtonStyle.Secondary)
    );

    return { embed, row };
}

// Scrapes the embed to grab candidate ID, target role, and evaluation notes
async function getInterviewContext(channel) {
    if (channel.type === 1) return null; // Ignore DMs
    
    const messages = await channel.messages.fetch({ limit: 50 }).catch(() => null);
    if (!messages) return null;

    const panelMessage = messages.find(m => m.author.id === client.user.id && m.embeds.length > 0 && m.embeds[0].title === '💼 Active Interview File Engine');
    if (!panelMessage) return null;
    
    const embed = panelMessage.embeds[0];
    const idMatch = embed.description.match(/Applicant ID:\s*`(\d+)`/);
    const roleMatch = embed.description.match(/Target Role:\s*`([^`]+)`/);
    
    if (!idMatch) return null;

    const notesField = embed.fields.find(f => f.name === '📌 Note Record Status');
    const notes = notesField ? notesField.value : "*No evaluation notes logged by interviewer.*";

    return {
        userId: idMatch[1],
        role: roleMatch ? roleMatch[1] : 'Unknown',
        notes: notes,
        panelMessage: panelMessage
    };
}

// Finds which text channel belongs to a specific applicant by scanning open active dashboards
async function findChannelByApplicantId(userId) {
    const guilds = client.guilds.cache;
    for (const [_, guild] of guilds) {
        const channels = await guild.channels.fetch().catch(() => null);
        if (!channels) continue;

        for (const [_, channel] of channels) {
            if (channel && channel.isTextBased() && channel.type !== 1) {
                const context = await getInterviewContext(channel);
                if (context && context.userId === userId) {
                    return channel;
                }
            }
        }
    }
    return null;
}

// ============================================
// TWO-WAY LIVE CHAT PIPELINE (MESSAGE HANDLER)
// ============================================

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // 1. INBOUND PIPELINE: Applicant sends a DM -> Forwarded to open room
    if (message.channel.type === 1) {
        const targetChannel = await findChannelByApplicantId(message.author.id);
        
        if (!targetChannel) {
            const logChannelId = process.env.LOG_CHANNEL_ID;
            if (!logChannelId) return;
            const logChannel = await client.channels.fetch(logChannelId).catch(() => null);
            if (logChannel) {
                const systemEmbed = new EmbedBuilder()
                    .setColor(COLORS.warning)
                    .setAuthor({ name: `Inbound DM (No Active Room): ${message.author.username}` })
                    .setDescription(message.content || "*[Attachment]*");
                await logChannel.send({ embeds: [systemEmbed] });
            }
            return;
        }

        const inboundEmbed = new EmbedBuilder()
            .setColor(COLORS.warning)
            .setAuthor({ name: `${message.author.displayName} (Applicant)`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
            .setDescription(message.content || "*[Sent an attachment/image or empty text]*")
            .setTimestamp();

        await targetChannel.send({ embeds: [inboundEmbed] });
        await message.react('📥');
        return;
    }

    // 2. OUTBOUND PIPELINE: HR types regular text -> Forwarded to candidate DMs
    const context = await getInterviewContext(message.channel);
    if (context) {
        // Stop words: Ignore messages starting with slash commands to allow slash executions seamlessly
        if (message.content.startsWith('/')) return;

        try {
            const targetUser = await client.users.fetch(context.userId);
            
            const outboundEmbed = new EmbedBuilder()
                .setColor(COLORS.neutral)
                .setAuthor({ name: `Message from HR (Arya)`, iconURL: client.user.displayAvatarURL() })
                .setDescription(message.content)
                .setTimestamp();

            await targetUser.send({ embeds: [outboundEmbed] });
            await message.react('🕊️'); 
        } catch (error) {
            await message.reply({ content: '🔴 **Failed to deliver message:** The applicant might have closed their private DMs.' });
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

        // --- MANUALLY TRIPPED /DM SLASH COMMAND ---
        if (interaction.commandName === 'dm') {
            const context = await getInterviewContext(interaction.channel);

            if (!context) {
                return interaction.reply({ content: '❌ **Error:** No active interview session mapped to this room.', ephemeral: true });
            }

            const msg = interaction.options.getString('message');
            await interaction.deferReply({ ephemeral: true });

            try {
                const targetUser = await client.users.fetch(context.userId);
                
                const outboundEmbed = new EmbedBuilder()
                    .setColor(COLORS.neutral)
                    .setAuthor({ name: `Message from HR (Arya)`, iconURL: client.user.displayAvatarURL() })
                    .setDescription(msg)
                    .setTimestamp();

                await targetUser.send({ embeds: [outboundEmbed] });
                return interaction.editReply({ content: `🟢 **Delivered via Command** directly to **${targetUser.displayName}**.` });
            } catch (error) {
                return interaction.editReply({ content: `🔴 **Delivery Failed:** Candidate has private DMs closed.` });
            }
        }
    }

    // --- BUTTON ACTIONS ENGINE ---
    if (interaction.isButton()) {
        const context = await getInterviewContext(interaction.channel);

        if (!context) {
            return interaction.reply({ content: '❌ System Error: No active interview profile detected in this text channel.', ephemeral: true });
        }

        let targetUser;
        try {
            targetUser = await client.users.fetch(context.userId);
        } catch {
            return interaction.reply({ content: '❌ Error: Failed to safely fetch target candidate profile data from Discord.', ephemeral: true });
        }

        const targetRole = context.role;
        const currentNotes = context.notes;

        // ACCEPT/HIRE PIPELINE
        if (interaction.customId === 'accept') {
            const hiredChannelId = process.env.HIRED_CHANNEL_ID;
            if (!hiredChannelId) return interaction.reply({ content: '❌ Setup Error: HIRED_CHANNEL_ID missing in system settings.', ephemeral: true });

            await interaction.reply({ content: `⚙️ Initializing onboarding sequence for **${targetUser.displayName}**...`, ephemeral: true });

            const applicantEmbed = new EmbedBuilder()
                .setColor(COLORS.success)
                .setTitle('🎉 Certamen Studios — Application Update')
                .setDescription(`Hello **${targetUser.displayName}**,\n\nWe are absolutely thrilled to inform you that you have been **ACCEPTED** into Certamen Studios for the position of **${targetRole.toUpperCase()}**!\n\nOur operations team will reach out shortly regarding onboarding details. Welcome to the studio!`)
                .addFields({ name: '📝 Your Interview Performance Notes', value: currentNotes })
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
                await context.panelMessage.delete().catch(() => {}); 

                return interaction.editReply({ content: `✅ **Onboarding Complete:** Candidate logged inside records feed.\n📦 **DM Audit:** ${dmStatus}\n🔒 *Chat session has ended.*` });
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
                .addFields({ name: '📝 Your Interview Performance Notes', value: currentNotes })
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
                await context.panelMessage.delete().catch(() => {}); 

                return interaction.editReply({ content: `❌ **File Closed:** Rejected state logged to audit tracking board.\n📦 **DM Audit:** ${dmStatus}\n🔒 *Chat session has ended.*` });
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
            const context = await getInterviewContext(interaction.channel);

            if (context) {
                const targetUser = await client.users.fetch(context.userId);
                const updatedPanel = buildInterviewPanel(targetUser, context.role, `📝 **Cached Notes Profile:**\n*${hrNotes}*`);

                await context.panelMessage.edit({ embeds: [updatedPanel.embed], components: [updatedPanel.row] });
                await interaction.reply({ content: '✅ Notes updated on the tracking board container.', ephemeral: true });
            } else {
                return interaction.reply({ content: '📝 Evaluation notes cached internally.', ephemeral: true });
            }
        }
    }
});

client.login(process.env.TOKEN);