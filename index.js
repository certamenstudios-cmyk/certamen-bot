const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    SlashCommandBuilder,
    REST,
    ModalBuilder,       
    TextInputBuilder,   
    TextInputStyle,     
    Routes
} = require('discord.js');

require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent
    ]
});

const COLORS = {
    neutral: '#2c2f33',
    success: '#43b581',
    danger: '#f04747',
    warning: '#faa61a',
    info: '#7289da'
};

// ============================================
//   THE ULTIMATE COMMAND ENGINE REGISTRATION
// ============================================

const commands = [
    new SlashCommandBuilder()
        .setName('intro')
        .setDescription('Send a polished HR welcome introduction to an applicant')
        .addUserOption(option => 
            option.setName('applicant').setDescription('The candidate you are greeting').setRequired(true)
        ),
    new SlashCommandBuilder()
        .setName('dm')
        .setDescription('Send an official, beautifully styled message to a candidate\'s inbox')
        .addUserOption(option => 
            option.setName('target').setDescription('The candidate to receive the DM').setRequired(true)
        )
        .addStringOption(option => 
            option.setName('message').setDescription('The precise message content').setRequired(true)
        ),
    new SlashCommandBuilder()
        .setName('decision')
        .setDescription('Open the ultimate HR action terminal for an applicant')
        .addUserOption(option => 
            option.setName('candidate').setDescription('The candidate up for review').setRequired(true)
        )
        .addStringOption(option => 
            option.setName('role').setDescription('Designated target role (e.g., Builder, Scripter)').setRequired(true)
        )
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
    console.log(`✨ ${client.user.tag} Ultimate HR Console is fully active.`);
    try {
        // This completely flushes and overrides old command data to fix the broken /dm bug!
        console.log('🔄 Refreshing clean slash command structures...');
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('✅ Commands successfully deployed and synced globally.');
    } catch (error) {
        console.error('❌ Failed to register commands:', error);
    }
});

// ============================================
//         INTERFACE RENDER ENGINE
// ============================================

function renderDecisionPanel(user, role) {
    return new EmbedBuilder()
        .setColor(COLORS.neutral)
        .setAuthor({ name: 'Certamen Studios — HR Executive Command Center', iconURL: client.user.displayAvatarURL() })
        .setTitle('💼 Talent Evaluation Dashboard')
        .setDescription(`Reviewing application profile for **${user.displayName}**.\nUse the action tools below to lock in structural data notes and issue critical updates directly to their inbox.`)
        .addFields(
            { name: '👤 Candidate Name', value: `${user} (@${user.username})`, inline: true },
            { name: '🆔 Account ID', value: `\`${user.id}\``, inline: true },
            { name: '🛠️ Target Designation', value: `\`${role.toUpperCase()}\``, inline: true },
            { name: '📌 Interview Performance Evaluation Record', value: `*No evaluation notes logged yet. Click the "Add Notes" button to save performance feedback.*` }
        )
        .setTimestamp()
        .setFooter({ text: 'Certamen Human Resources Framework' });
}

function getDecisionComponents(userId) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`accept_${userId}`).setLabel('Accept & Hire').setEmoji('✅').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`reject_${userId}`).setLabel('Reject Candidate').setEmoji('❌').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId(`note_${userId}`).setLabel('Add Notes').setEmoji('📝').setStyle(ButtonStyle.Secondary)
    );
}

// ============================================
//            INTERACTION CORE
// ============================================

client.on('interactionCreate', async interaction => {
    
    // --- SLASH COMMANDS HANDLER ---
    if (interaction.isChatInputCommand()) {
        
        if (interaction.commandName === 'intro') {
            const applicant = interaction.options.getUser('applicant');
            
            const introEmbed = new EmbedBuilder()
                .setColor(COLORS.info)
                .setTitle('👋 Welcome to your Interview')
                .setDescription(`Hello ${applicant},\n\nMy name is **Arya**, and I am your designated Human Resources representative today.\n\nPlease ensure your documentation and portfolio are ready to share. We look forward to looking over your work!`)
                .setFooter({ text: 'Certamen Studios Onboarding' })
                .setTimestamp();

            return interaction.reply({ embeds: [introEmbed] });
        }

        if (interaction.commandName === 'dm') {
            await interaction.deferReply({ ephemeral: true });
            const targetUser = interaction.options.getUser('target');
            const messageContent = interaction.options.getString('message');

            const dmEmbed = new EmbedBuilder()
                .setColor(COLORS.neutral)
                .setAuthor({ name: 'Message from HR (Arya)', iconURL: client.user.displayAvatarURL() })
                .setDescription(messageContent)
                .setTimestamp()
                .setFooter({ text: 'Certamen Studios Correspondence' });

            try {
                await targetUser.send({ embeds: [dmEmbed] });
                return interaction.editReply({ content: `🟢 **Delivered:** Message safely sent to **${targetUser.displayName}**'s private inbox.` });
            } catch {
                return interaction.editReply({ content: `🔴 **Delivery Failed:** ${targetUser.displayName} has their private DMs turned off for this server.` });
            }
        }

        if (interaction.commandName === 'decision') {
            const candidate = interaction.options.getUser('candidate');
            const role = interaction.options.getString('role');

            const panelEmbed = renderDecisionPanel(candidate, role);
            const panelButtons = getDecisionComponents(candidate.id);

            return interaction.reply({ embeds: [panelEmbed], components: [panelButtons] });
        }
    }

    // --- INTERACTIVE BUTTON HANDLER ---
    if (interaction.isButton()) {
        const [action, targetId] = interaction.customId.split('_');
        
        let targetUser;
        try {
            targetUser = await client.users.fetch(targetId);
        } catch {
            return interaction.reply({ content: '❌ **Error:** Unable to track target user context data securely through Discord.', ephemeral: true });
        }

        // Grab current data from the message embed safely
        const embed = interaction.message.embeds[0];
        const roleField = embed.fields.find(f => f.name === '🛠️ Target Designation');
        const role = roleField ? roleField.value.replace(/`/g, '') : 'UNKNOWN';
        
        const notesField = embed.fields.find(f => f.name === '📌 Interview Performance Evaluation Record');
        const finalNotes = notesField ? notesField.value : '*No notes provided.*';

        // 1. OPEN NOTES SCRATCHPAD MODAL
        if (action === 'note') {
            const modal = new ModalBuilder()
                .setCustomId(`modal_${targetId}`)
                .setTitle('Evaluation Performance Scratchpad');

            const textInput = new TextInputBuilder()
                .setCustomId('notes_input')
                .setLabel('Performance Review Details')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Type out technical performance, portfolio ratings, and feedback here...')
                .setRequired(true)
                .setMaxLength(1000);

            modal.addComponents(new ActionRowBuilder().addComponents(textInput));
            return interaction.showModal(modal);
        }

        // 2. ACCEPT / HIRE PIPELINE
        if (action === 'accept') {
            const hiredChannelId = process.env.HIRED_CHANNEL_ID;
            if (!hiredChannelId) return interaction.reply({ content: '❌ Setup Error: HIRED_CHANNEL_ID missing in system configs.', ephemeral: true });

            await interaction.reply({ content: `⚙️ Logging permanent hire parameters for **${targetUser.displayName}**...`, ephemeral: true });

            const offerEmbed = new EmbedBuilder()
                .setColor(COLORS.success)
                .setTitle('🎉 Certamen Studios — Application Accepted!')
                .setDescription(`Hello **${targetUser.displayName}**,\n\nWe are absolutely thrilled to inform you that you have been **ACCEPTED** into Certamen Studios for the position of **${role.toUpperCase()}**!\n\nOur operations team will reach out shortly regarding onboarding details. Welcome to the studio!`)
                .addFields({ name: '📝 Your Interview Performance Notes', value: finalNotes })
                .setTimestamp();

            let dmAudit = "🟢 Delivered to DM.";
            try { await targetUser.send({ embeds: [offerEmbed] }); } catch { dmAudit = "⚠️ DM Locked."; }

            try {
                const logsChan = await client.channels.fetch(hiredChannelId);
                const auditRecord = new EmbedBuilder()
                    .setColor(COLORS.success)
                    .setTitle('🟢 New Talent Recruited')
                    .setThumbnail(targetUser.displayAvatarURL())
                    .addFields(
                        { name: '👤 Employee', value: `${targetUser} (@${targetUser.username})`, inline: true },
                        { name: '🛠️ Assigned Designation', value: `\`${role.toUpperCase()}\``, inline: true },
                        { name: '📝 Performance Review', value: finalNotes, inline: false }
                    )
                    .setTimestamp()
                    .setFooter({ text: `Processed by HR Agent: ${interaction.user.tag}` });

                await logsChan.send({ embeds: [auditRecord] });
                await interaction.message.delete().catch(() => {});
                return interaction.editReply({ content: `✅ **Success:** Talent hired successfully. Logs sent.\n📦 **DM Status:** ${dmAudit}` });
            } catch (err) {
                return interaction.editReply({ content: '❌ Database Core Failure: Could not post to logging feed.' });
            }
        }

        // 3. REJECT / FILE ARCHIVE PIPELINE
        if (action === 'reject') {
            const notHiredChannelId = process.env.NOT_HIRED_CHANNEL_ID;
            if (!notHiredChannelId) return interaction.reply({ content: '❌ Setup Error: NOT_HIRED_CHANNEL_ID missing in system configs.', ephemeral: true });

            await interaction.reply({ content: `⚙️ Archiving candidate record parameters for **${targetUser.displayName}**...`, ephemeral: true });

            const rejectEmbed = new EmbedBuilder()
                .setColor(COLORS.danger)
                .setTitle('Certamen Studios — Application Status Update')
                .setDescription(`Hello **${targetUser.displayName}**,\n\nThank you for taking the time to interview with our HR department. Unfortunately, at this time we have decided not to move forward with your application file for the **${role.toUpperCase()}** position.\n\nWe wish you the absolute best in your future development journey.`)
                .addFields({ name: '📝 Your Interview Performance Notes', value: finalNotes })
                .setTimestamp();

            let dmAudit = "🟢 Delivered to DM.";
            try { await targetUser.send({ embeds: [rejectEmbed] }); } catch { dmAudit = "⚠️ DM Locked."; }

            try {
                const logsChan = await client.channels.fetch(notHiredChannelId);
                const auditRecord = new EmbedBuilder()
                    .setColor(COLORS.danger)
                    .setTitle('🔴 Application Record Archived')
                    .setThumbnail(targetUser.displayAvatarURL())
                    .addFields(
                        { name: '👤 Candidate', value: `${targetUser} (@${targetUser.username})`, inline: true },
                        { name: '🛠️ Attempted Designation', value: `\`${role.toUpperCase()}\``, inline: true },
                        { name: '📝 Performance Review', value: finalNotes, inline: false }
                    )
                    .setTimestamp()
                    .setFooter({ text: `Processed by HR Agent: ${interaction.user.tag}` });

                await logsChan.send({ embeds: [auditRecord] });
                await interaction.message.delete().catch(() => {});
                return interaction.editReply({ content: `❌ **File Deactivated:** Record sent to archives.\n📦 **DM Status:** ${dmAudit}` });
            } catch (err) {
                return interaction.editReply({ content: '❌ Database Core Failure: Could not post archive logs.' });
            }
        }
    }

    // --- MODAL FEEDBACK CAPTURE HANDLER ---
    if (interaction.isModalSubmit()) {
        const [_, targetId] = interaction.customId.split('_');
        const notesValue = interaction.fields.getTextInputValue('notes_input');
        
        let targetUser;
        try { targetUser = await client.users.fetch(targetId); } catch { return; }

        const embed = interaction.message.embeds[0];
        const roleField = embed.fields.find(f => f.name === '🛠️ Target Designation');
        const role = roleField ? roleField.value.replace(/`/g, '') : 'UNKNOWN';

        const updatedEmbed = new EmbedBuilder()
            .setColor(COLORS.warning)
            .setAuthor({ name: 'Certamen Studios — HR Executive Command Center', iconURL: client.user.displayAvatarURL() })
            .setTitle('💼 Talent Evaluation Dashboard')
            .setDescription(`Reviewing application profile for **${targetUser.displayName}**.\nUse the action tools below to lock in structural data notes and issue critical updates directly to their inbox.`)
            .addFields(
                { name: '👤 Candidate Name', value: `<@${targetUser.id}> (@${targetUser.username})`, inline: true },
                { name: '🆔 Account ID', value: `\`${targetUser.id}\``, inline: true },
                { name: '🛠️ Target Designation', value: `\`${role.toUpperCase()}\``, inline: true },
                { name: '📌 Interview Performance Evaluation Record', value: notesValue }
            )
            .setTimestamp()
            .setFooter({ text: 'Certamen Human Resources Framework • Evaluation Cached' });

        await interaction.update({ embeds: [updatedEmbed] });
    }
});

client.login(process.env.TOKEN);