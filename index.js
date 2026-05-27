const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    SlashCommandBuilder,
    REST,
    Routes,
    ChannelType,
    Partials
} = require('discord.js');

require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel, Partials.Message]
});

// ============================================
//         STUDIO CONFIGURATION CORE
// ============================================
const CONFIG = {
    HIRED_CHANNEL_ID: '1508153883669827757',
    NOT_HIRED_CHANNEL_ID: '1508153941521858680',
    FORUM_CHANNEL_ID: '1509210757248581782', // ✅ Linked to your Forum Channel
    MANAGEMENT_ROLE_ID: 'YOUR_STAFF_ROLE_ID_HERE'   // 👈 Put your staff team role ID here
};

const COLORS = {
    neutral: '#2c2f33',
    success: '#43b581',
    danger: '#f04747',
    warning: '#faa61a',
    info: '#7289da'
};

// Simple local runtime data storage cache
const SYSTEM_CACHE = {
    totalInterviews: 0,
    activeInterviews: 0,
    acceptedCount: 0,
    rejectedCount: 0,
    userNotes: {} // Format: { userId: ["note 1", "note 2"] }
};

// ============================================
//         COMMAND REGISTRATION ENGINE
// ============================================

const commands = [
    new SlashCommandBuilder()
        .setName('interview')
        .setDescription('Open a live-chat forum thread bridge for an applicant using choice elements')
        .addUserOption(option => 
            option.setName('candidate').setDescription('Select the target candidate from the server list').setRequired(true)
        ),
    new SlashCommandBuilder()
        .setName('dashboard')
        .setDescription('View the live deployment metrics dashboard for HR operations'),
    new SlashCommandBuilder()
        .setName('notes')
        .setDescription('Manage operational internal profile files or notes for a user')
        .addSubcommand(sub =>
            sub.setName('add')
               .setDescription('Append a new assessment note to a candidate file')
               .addUserOption(opt => opt.setName('target').setDescription('The candidate').setRequired(true))
               .addStringOption(opt => opt.setName('content').setDescription('The verification note text').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('view')
               .setDescription('Retrieve and display an applicant log history profile')
               .addUserOption(opt => opt.setName('target').setDescription('The candidate').setRequired(true))
        ),
    new SlashCommandBuilder()
        .setName('onboard')
        .setDescription('Send portfolio feedback and portal onboarding instructions')
        .addUserOption(option => option.setName('applicant').setDescription('The candidate moving forward').setRequired(true)),
    new SlashCommandBuilder()
        .setName('process')
        .setDescription('Notify the candidate that their files are being processed')
        .addUserOption(option => option.setName('applicant').setDescription('The candidate whose file is compiling').setRequired(true))
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
    console.log(`✨ ${client.user.tag} Ultimate Operations Console is live.`);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('✅ Advanced command interfaces synced successfully.');
    } catch (error) {
        console.error('❌ Sync failed:', error);
    }
});

// ============================================
//          INTERACTION CORE CONTROLLER
// ============================================

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // --- INTERVIEW COMMAND (DROPDOWN TRIGGER) ---
    if (interaction.commandName === 'interview') {
        const candidate = interaction.options.getUser('candidate');

        const selectionEmbed = new EmbedBuilder()
            .setColor(COLORS.info)
            .setTitle('🛠️ Department Assignment Deployment')
            .setDescription(`Select the designated target operations sector or project group for **${candidate.username}** below to spin up their bridge file.`);

        const sectorMenu = new StringSelectMenuBuilder()
            .setCustomId(`selectsector_${candidate.id}`)
            .setPlaceholder('Choose target assignment sector...')
            .addOptions(
                new StringSelectMenuOptionBuilder().setLabel('Programming & Scripting').setValue('scripter').setDescription('Lua systems architecture and assembly.').setEmoji('💻'),
                new StringSelectMenuOptionBuilder().setLabel('Environmental Design & Building').setValue('builder').setDescription('3D environment layout layout designs.').setEmoji('🔨'),
                new StringSelectMenuOptionBuilder().setLabel('User Interface & Graphic Design').setValue('ui_designer').setDescription('Vector elements layouts and aesthetic UI.').setEmoji('🎨'),
                new StringSelectMenuOptionBuilder().setLabel('Project Quality & Management').setValue('management').setDescription('Asset orchestration and product deployment.').setEmoji('📊')
            );

        const row = new ActionRowBuilder().addComponents(sectorMenu);
        return interaction.reply({ embeds: [selectionEmbed], components: [row], ephemeral: true });
    }

    // --- DASHBOARD COMMAND ---
    if (interaction.commandName === 'dashboard') {
        const dashEmbed = new EmbedBuilder()
            .setColor(COLORS.neutral)
            .setTitle('📊 Certamen Studios HR Metrics Monitor')
            .setDescription('Real-time analytics engine deployment state logs.')
            .addFields(
                { name: '🔄 Live Bridges Open', value: `\`${SYSTEM_CACHE.activeInterviews}\` Active`, inline: true },
                { name: '📈 Combined Sessions', value: `\`${SYSTEM_CACHE.totalInterviews}\` Total`, inline: true },
                { name: '🏆 Accepted Roster', value: `\`${SYSTEM_CACHE.acceptedCount}\` Hired`, inline: true },
                { name: '📁 Archived Denials', value: `\`${SYSTEM_CACHE.rejectedCount}\` Denied`, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'System Diagnostics Log Frame' });

        return interaction.reply({ embeds: [dashEmbed] });
    }

    // --- NOTES MANAGEMENT COMMANDS ---
    if (interaction.commandName === 'notes') {
        const subcommand = interaction.options.getSubcommand();
        const target = interaction.options.getUser('target');

        if (!SYSTEM_CACHE.userNotes[target.id]) {
            SYSTEM_CACHE.userNotes[target.id] = [];
        }

        if (subcommand === 'add') {
            const content = interaction.options.getString('content');
            const timestampedNote = `\`[${new Date().toLocaleDateString()}]\` ${content} *(by ${interaction.user.username})*`;
            
            SYSTEM_CACHE.userNotes[target.id].push(timestampedNote);
            return interaction.reply({ content: `✅ Note added securely to **${target.username}'s** central operational profile history record.`, ephemeral: true });
        }

        if (subcommand === 'view') {
            const records = SYSTEM_CACHE.userNotes[target.id];
            
            const notesEmbed = new EmbedBuilder()
                .setColor(COLORS.warning)
                .setTitle(`📝 Evaluation History: ${target.username}`)
                .setDescription(records.length > 0 ? records.join('\n') : '*No background evaluation flags or custom notes logged on file for this user account code.*');

            return interaction.reply({ embeds: [notesEmbed], ephemeral: true });
        }
    }

    // --- ONBOARD COMMAND ---
    if (interaction.commandName === 'onboard') {
        const applicant = interaction.options.getUser('applicant');
        const onboardEmbed = new EmbedBuilder()
            .setColor(COLORS.success)
            .setAuthor({ name: 'Certamen Studios — Recruitment Portal', iconURL: client.user.displayAvatarURL() })
            .setTitle('🚀 Portfolio Approved — Next Steps')
            .setDescription(`Hello ${applicant},\n\nThat portfolio was incredibly impressive! We would love to move you forward to the **knowledge evaluation phase**.\n\nPlease follow the onboarding sequence below:`)
            .addFields({ 
                name: '📋 Onboarding Protocol', 
                value: '1️⃣ Head over to our [Certamen Onboarding Portal](https://emersondhaba.my.canva.site/certamen)\n2️⃣ Locate **Sign Up**, fill in details, and apply as an **Applicant**.\n3️⃣ **Log In** to your account.\n4️⃣ Complete the **Welcome Survey** to activate your testing module.' 
            })
            .setTimestamp();

        const linkButton = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setLabel('Open Onboarding Website').setURL('https://emersondhaba.my.canva.site/certamen').setStyle(ButtonStyle.Link)
        );
        return interaction.reply({ content: `${applicant}`, embeds: [onboardEmbed], components: [linkButton] });
    }

    // --- PROCESS COMMAND ---
    if (interaction.commandName === 'process') {
        const applicant = interaction.options.getUser('applicant');
        const processEmbed = new EmbedBuilder()
            .setColor(COLORS.warning)
            .setAuthor({ name: 'Certamen Studios — Core Processing Systems', iconURL: client.user.displayAvatarURL() })
            .setTitle('📁 Transmission Logged & Filed')
            .setDescription(`Thank you, ${applicant}. Your survey answers have been compiled cleanly and routed directly to our **Filing Department**.`)
            .addFields({
                name: '⚙️ Background Verification Operations',
                value: 'Your comprehensive application performance report is currently being auto-generated by our background core systems. \n\nWhile our administration logs finalize your file updates, **can we proceed with some baseline background checks?**'
            })
            .setTimestamp();
        return interaction.reply({ content: `${applicant}`, embeds: [processEmbed] });
    }
});

// ============================================
//        SELECT MENU CAPTURE ENGINE
// ============================================

client.on('interactionCreate', async interaction => {
    if (!interaction.isStringSelectMenu()) return;

    if (interaction.customId.startsWith('selectsector_')) {
        await interaction.deferUpdate();
        const candidateId = interaction.customId.split('_')[1];
        const role = interaction.values[0];

        let candidate;
        try { candidate = await client.users.fetch(candidateId); } catch { return; }

        try {
            const forumChannel = await client.channels.fetch(CONFIG.FORUM_CHANNEL_ID);
            const threadName = `${candidate.username} - ${role.toUpperCase()}`;

            const threadEmbed = new EmbedBuilder()
                .setColor(COLORS.info)
                .setTitle(`💬 Live Chat Active: ${candidate.username}`)
                .setDescription(`This is a dedicated, real-time message bridge to **${candidate.displayName}**.\n\n### 🛠️ Operation Rules:\n* **Anything you type below** will instantly deliver straight to their DMs.\n* **Any responses they send** will appear directly right here in real time.`)
                .addFields(
                    { name: '🆔 Target User ID', value: `\`${candidate.id}\``, inline: true },
                    { name: '🛠️ Position Applied', value: `\`${role.toUpperCase()}\``, inline: true }
                );

            const actionRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`hire_${candidate.id}_${role}`).setLabel('Hire & Close').setStyle(ButtonStyle.Success).setEmoji('✅'),
                new ButtonBuilder().setCustomId(`deny_${candidate.id}_${role}`).setLabel('Deny & Close').setStyle(ButtonStyle.Danger).setEmoji('❌')
            );

            const thread = await forumChannel.threads.create({
                name: threadName,
                autoArchiveDuration: 1440,
                message: {
                    content: `🎙️ **Interview Session Initiated** for ${candidate}. All messages are now bridged.`,
                    embeds: [threadEmbed],
                    components: [actionRow]
                }
            });

            // Update stats cache
            SYSTEM_CACHE.totalInterviews++;
            SYSTEM_CACHE.activeInterviews++;

            try {
                const welcomeEmbed = new EmbedBuilder()
                    .setColor(COLORS.info)
                    .setAuthor({ name: 'Message from HR (Arya)', iconURL: client.user.displayAvatarURL() })
                    .setDescription(`Hello **${candidate.displayName}**!\n\nI have successfully activated your secure interview communications line. My name is **Arya**, and I will be guiding you through today.\n\nYou can reply directly to this message block at any time!`);
                await candidate.send({ embeds: [welcomeEmbed] });
            } catch {}

            await interaction.followUp({ content: `✅ **Bridge Built:** Access here: <#${thread.id}>`, ephemeral: true });
        } catch (err) {
            console.error(err);
        }
    }
});

// ============================================
//       MESSAGE INTERCEPT ENGINE (THE BRIDGE)
// ============================================

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.channel.isThread() && message.channel.parent?.id === CONFIG.FORUM_CHANNEL_ID) {
        const startMessage = await message.channel.fetchStarterMessage().catch(() => null);
        if (!startMessage || !startMessage.embeds[0]) return;

        const idField = startMessage.embeds[0].fields.find(f => f.name === '🆔 Target User ID');
        if (!idField) return;

        const targetUserId = idField.value.replace(/`/g, '');

        try {
            const targetUser = await client.users.fetch(targetUserId);
            const outboundEmbed = new EmbedBuilder()
                .setColor(COLORS.neutral)
                .setAuthor({ name: `Message from Arya (HR Representative)`, iconURL: message.author.displayAvatarURL() })
                .setDescription(message.content)
                .setTimestamp();

            await targetUser.send({ embeds: [outboundEmbed] });
            await message.react('✉️').catch(() => {});
        } catch (error) {
            await message.reply({ content: '❌ **Message Dropped:** DMs blocked.' });
        }
    }

    if (message.channel.type === ChannelType.DM) {
        const forumChannel = await client.channels.fetch(CONFIG.FORUM_CHANNEL_ID).catch(() => null);
        if (!forumChannel) return;

        const activeThreads = await forumChannel.threads.fetchActive();
        
        let targetThread = null;
        for (const [_, thread] of activeThreads.threads) {
            const starter = await thread.fetchStarterMessage().catch(() => null);
            if (starter && starter.embeds[0]) {
                const idField = starter.embeds[0].fields.find(f => f.name === '🆔 Target User ID');
                if (idField && idField.value.replace(/`/g, '') === message.author.id) {
                    targetThread = thread;
                    break;
                }
            }
        }

        if (targetThread) {
            const incomingEmbed = new EmbedBuilder()
                .setColor(COLORS.success)
                .setAuthor({ name: `${message.author.username} (Applicant)`, iconURL: message.author.displayAvatarURL() })
                .setDescription(message.content)
                .setTimestamp();

            await targetThread.send({ embeds: [incomingEmbed] });
            await message.react('✅').catch(() => {});
        } else {
            await message.reply({ content: '❌ You do not have an active interview session open right now.' });
        }
    }
});

// ============================================
//        BUTTON PIPELINE RESOLVERS
// ============================================

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    const [action, targetId, role] = interaction.customId.split('_');
    if (action !== 'hire' && action !== 'deny') return;

    await interaction.reply({ content: '⚙️ Finalizing decision parameter pipeline...', ephemeral: true });

    let targetUser;
    try { targetUser = await client.users.fetch(targetId); } catch { return; }

    // Update global state counts
    if (SYSTEM_CACHE.activeInterviews > 0) SYSTEM_CACHE.activeInterviews--;

    if (action === 'hire') {
        SYSTEM_CACHE.acceptedCount++;
        const offerEmbed = new EmbedBuilder()
            .setColor(COLORS.success)
            .setTitle('🎉 Certamen Studios — Application Accepted!')
            .setDescription(`Hello **${targetUser.displayName}**,\n\nWe are absolutely thrilled to inform you that you have been **ACCEPTED** into Certamen Studios for the position of **${role.toUpperCase()}**!`);

        try { await targetUser.send({ embeds: [offerEmbed] }); } catch {}

        const logsChan = await client.channels.fetch(CONFIG.HIRED_CHANNEL_ID).catch(() => null);
        if (logsChan) {
            const audit = new EmbedBuilder()
                .setColor(COLORS.success)
                .setTitle('🟢 New Talent Recruited')
                .addFields(
                    { name: '👤 Employee', value: `${targetUser}`, inline: true },
                    { name: '🛠️ Assigned Designation', value: `\`${role.toUpperCase()}\``, inline: true }
                );
            await logsChan.send({ embeds: [audit] });
        }

        await interaction.channel.setName(`[HIRED] ${targetUser.username}`);
        await interaction.channel.setArchived(true);
    }

    if (action === 'deny') {
        SYSTEM_CACHE.rejectedCount++;
        const rejectEmbed = new EmbedBuilder()
            .setColor(COLORS.danger)
            .setTitle('Certamen Studios — Application Status Update')
            .setDescription(`Hello **${targetUser.displayName}**,\n\nThank you for taking the time to talk with us. Unfortunately, at this time we have decided not to move forward with your application file.`);

        try { await targetUser.send({ embeds: [rejectEmbed] }); } catch {}

        const logsChan = await client.channels.fetch(CONFIG.NOT_HIRED_CHANNEL_ID).catch(() => null);
        if (logsChan) {
            const audit = new EmbedBuilder()
                .setColor(COLORS.danger)
                .setTitle('🔴 Application Record Archived')
                .addFields(
                    { name: '👤 Candidate', value: `${targetUser}`, inline: true },
                    { name: '🛠️ Attempted Designation', value: `\`${role.toUpperCase()}\``, inline: true }
                );
            await logsChan.send({ embeds: [audit] });
        }

        await interaction.channel.setName(`[DENIED] ${targetUser.username}`);
        await interaction.channel.setArchived(true);
    }
});

client.login(process.env.TOKEN);