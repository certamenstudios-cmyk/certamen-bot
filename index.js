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

// ============================================
//         STUDIO CONFIGURATION CORE
// ============================================
const CONFIG = {
    HIRED_CHANNEL_ID: '1508153883669827757',
    NOT_HIRED_CHANNEL_ID: '1508153941521858680'
};

const COLORS = {
    neutral: '#2c2f33',
    success: '#43b581',
    danger: '#f04747',
    warning: '#faa61a',
    info: '#7289da'
};

// ============================================
//         COMMAND REGISTRATION ENGINE
// ============================================

const commands = [
    new SlashCommandBuilder()
        .setName('intro')
        .setDescription('Send a polished HR welcome introduction to an applicant')
        .addUserOption(option => 
            option.setName('applicant').setDescription('The candidate you are greeting').setRequired(true)
        ),
    new SlashCommandBuilder()
        .setName('onboard')
        .setDescription('Send portfolio feedback and portal onboarding instructions')
        .addUserOption(option =>
            option.setName('applicant').setDescription('The candidate moving to the next stage').setRequired(true)
        ),
    new SlashCommandBuilder()
        .setName('process')
        .setDescription('Notify the candidate that their files are being processed and request background checks')
        .addUserOption(option =>
            option.setName('applicant').setDescription('The candidate whose file is compiling').setRequired(true)
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
        console.log('🔄 Refreshing clean slash command structures...');
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('✅ Commands successfully deployed and synced globally.');
    } catch (error) {
        console.error('❌ Failed to register commands:', error);
    }
});

// ============================================
//         INTERFACE RENDER MODULES
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

        if (interaction.commandName === 'onboard') {
            const applicant = interaction.options.getUser('applicant');

            const onboardEmbed = new EmbedBuilder()
                .setColor(COLORS.success)
                .setAuthor({ name: 'Certamen Studios — Recruitment Portal', iconURL: client.user.displayAvatarURL() })
                .setTitle('🚀 Portfolio Approved — Next Steps')
                .setDescription(`Hello ${applicant},\n\nThat portfolio was incredibly impressive! We would love to move you forward to the **knowledge evaluation phase** of our application pipeline.\n\nPlease follow the onboarding sequence below to set up your profile:`)
                .addFields(
                    { 
                        name: '📋 Onboarding Protocol', 
                        value: '1️⃣ Head over to our [Certamen Onboarding Portal](https://emersondhaba.my.canva.site/certamen)\n2️⃣ Locate the **Sign Up** section, fill in your profile details, and apply as an **Applicant**.\n3️⃣ **Log In** to your newly established account.\n4️⃣ Complete the **Welcome Survey** to activate your testing module.' 
                    }
                )
                .setTimestamp()
                .setFooter({ text: 'Certamen Studios Evaluation Phase' });

            const linkButton = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel('Open Onboarding Website')
                    .setURL('https://emersondhaba.my.canva.site/certamen')
                    .setStyle(ButtonStyle.Link)
            );

            return interaction.reply({ content: `${applicant}`, embeds: [onboardEmbed], components: [linkButton] });
        }

        if (interaction.commandName === 'process') {
            const applicant = interaction.options.getUser('applicant');

            const processEmbed = new EmbedBuilder()
                .setColor(COLORS.warning)
                .setAuthor({ name: 'Certamen Studios — Core Processing Systems', iconURL: client.user.displayAvatarURL() })
                .setTitle('📁 Transmission Logged & Filed')
                .setDescription(`Thank you, ${applicant}. Your survey answers have been compiled cleanly and routed directly to our **Filing Department**.`)
                .addFields(
                    {
                        name: '⚙️ Background Verification Operations',
                        value: 'Your comprehensive application performance report is currently being auto-generated by our background core systems. \n\nWhile our administration logs finalize your file updates, **can we proceed with some baseline background checks?**'
                    }
                )
                .setTimestamp()
                .setFooter({ text: 'Certamen Studios Security Clearance' });

            return interaction.reply({ content: `${applicant}`, embeds: [processEmbed] });
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
        if (action === 'link') return; 
        
        let targetUser;
        try {
            targetUser = await client.users.fetch(targetId);
        } catch {
            return interaction.reply({ content: '❌ **Error:** Unable to track target user context data securely through Discord.', ephemeral: true });
        }

        const embed = interaction.message.embeds[0];
        const roleField = embed.fields.find(f => f.name === '🛠️ Target Designation');
        const role = roleField ? roleField.value.replace(/`/g, '') : 'UNKNOWN';
        
        const notesField = embed.fields.find(f => f.name === '📌 Interview Performance Evaluation Record');
        const finalNotes = notesField ? notesField.value : '*No notes provided.*';

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

        if (action === 'accept') {
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
                const logsChan = await client.channels.fetch(CONFIG.HIRED_CHANNEL_ID);
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
                return interaction.editReply({ content: `✅ **Success:** Talent hired successfully. Logs sent to <#${CONFIG.HIRED_CHANNEL_ID}>.\n📦 **DM Status:** ${dmAudit}` });
            } catch (err) {
                console.error(err);
                return interaction.editReply({ content: '❌ Database Core Failure: Could not find or post to the Hired logging channel.' });
            }
        }

        if (action === 'reject') {
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
                const logsChan = await client.channels.fetch(CONFIG.NOT_HIRED_CHANNEL_ID);
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
                return interaction.editReply({ content: `❌ **File Deactivated:** Record sent to archives in <#${CONFIG.NOT_HIRED_CHANNEL_ID}>.\n📦 **DM Status:** ${dmAudit}` });
            } catch (err) {
                console.error(err);
                return interaction.editReply({ content: '❌ Database Core Failure: Could not find or post to the Not Hired archiving channel.' });
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