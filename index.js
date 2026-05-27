const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
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
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers // 👈 CRITICAL: Allows the bot to scan and message users across any server it is in!
    ],
    partials: [Partials.Channel, Partials.Message]
});

// ============================================
//         STUDIO CONFIGURATION CORE
// ============================================
const CONFIG = {
    HIRED_CHANNEL_ID: '1508153883669827757',
    NOT_HIRED_CHANNEL_ID: '1508153941521858680',
    FORUM_CHANNEL_ID: 'YOUR_FORUM_CHANNEL_ID_HERE' 
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
        .setName('interview')
        .setDescription('Create a dedicated live-chat forum thread bridge for an applicant via User ID')
        .addStringOption(option => 
            option.setName('candidate_id').setDescription('The precise Discord User ID of the candidate').setRequired(true)
        )
        .addStringOption(option => 
            option.setName('role').setDescription('Designated target role (e.g., Builder, Scripter)').setRequired(true)
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
//          LIVE-CHAT BRIDGE CONTROLLER
// ============================================

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'interview') {
        await interaction.deferReply({ ephemeral: true });
        const candidateId = interaction.options.getString('candidate_id');
        const role = interaction.options.getString('role');

        let candidate;
        try {
            // This force-fetches the user directly from Discord's global database backend
            candidate = await client.users.fetch(candidateId);
        } catch {
            return interaction.editReply({ content: '❌ **User Not Found:** That Discord User ID does not exist or is completely invalid.' });
        }

        try {
            const forumChannel = await client.channels.fetch(CONFIG.FORUM_CHANNEL_ID);
            if (!forumChannel || forumChannel.type !== ChannelType.GuildForum) {
                return interaction.editReply({ content: '⚠️ **Configuration Error:** Invalid Forum Channel ID.' });
            }

            const threadName = `${candidate.username} - ${role.toUpperCase()}`;

            const threadEmbed = new EmbedBuilder()
                .setColor(COLORS.info)
                .setTitle(`💬 Live Chat Active: ${candidate.username}`)
                .setDescription(`This is a dedicated, real-time message bridge to **${candidate.displayName}**.\n\n### 🛠️ Operation Rules:\n* **Anything you type below** will instantly deliver straight to their DMs.\n* **Any responses they send** will appear directly right here in real time.\n* When you finish the session, use the action buttons below to clean up or lock the log file.`)
                .addFields(
                    { name: '🆔 Target User ID', value: `\`${candidate.id}\``, inline: true },
                    { name: '🛠️ Position Applied', value: `\`${role.toUpperCase()}\``, inline: true }
                )
                .setFooter({ text: 'Certamen Live Communication Engine' });

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

            // Dispatch DM to the candidate
            try {
                const welcomeEmbed = new EmbedBuilder()
                    .setColor(COLORS.info)
                    .setAuthor({ name: 'Message from HR (Arya)', iconURL: client.user.displayAvatarURL() })
                    .setDescription(`Hello **${candidate.displayName}**!\n\nI have successfully activated your secure interview communications line. My name is **Arya**, and I will be guiding you through today.\n\nYou can reply directly to this message block at any time, and your responses will route straight to our team!`)
                    .setTimestamp();
                
                await candidate.send({ embeds: [welcomeEmbed] });
            } catch {
                await thread.send({ content: `⚠️ **Warning:** The user was found, but the DM couldn't be sent. They might need to turn on "Allow direct messages from server members" in their privacy settings, or share a server with this bot.` });
            }

            return interaction.editReply({ content: `✅ **Success:** Dedicated forum session bridge created! Check it out here: <#${thread.id}>` });

        } catch (err) {
            console.error(err);
            return interaction.editReply({ content: '❌ **System Crash:** Failed to generate your forum chat thread.' });
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
//       MESSAGE INTERCEPT ENGINE (THE BRIDGE)
// ============================================

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // 1. OUTBOUND: FROM THREAD TO USER DM
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
            await message.reply({ content: '❌ **Message Dropped:** Could not dispatch DM packet to this candidate. DMs might be locked.' });
        }
    }

    // 2. INBOUND: FROM USER DM TO FORUM THREAD
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

    if (action === 'hire') {
        const offerEmbed = new EmbedBuilder()
            .setColor(COLORS.success)
            .setTitle('🎉 Certamen Studios — Application Accepted!')
            .setDescription(`Hello **${targetUser.displayName}**,\n\nWe are absolutely thrilled to inform you that you have been **ACCEPTED** into Certamen Studios for the position of **${role.toUpperCase()}**!\n\nOur operations team will reach out shortly regarding onboarding details. Welcome aboard!`)
            .setTimestamp();

        try { await targetUser.send({ embeds: [offerEmbed] }); } catch {}

        const logsChan = await client.channels.fetch(CONFIG.HIRED_CHANNEL_ID).catch(() => null);
        if (logsChan) {
            const audit = new EmbedBuilder()
                .setColor(COLORS.success)
                .setTitle('🟢 New Talent Recruited')
                .addFields(
                    { name: '👤 Employee', value: `${targetUser} (@${targetUser.username})`, inline: true },
                    { name: '🛠️ Assigned Designation', value: `\`${role.toUpperCase()}\``, inline: true }
                ).setTimestamp();
            await logsChan.send({ embeds: [audit] });
        }

        await interaction.channel.setName(`[HIRED] ${targetUser.username}`);
        await interaction.channel.setArchived(true);
    }

    if (action === 'deny') {
        const rejectEmbed = new EmbedBuilder()
            .setColor(COLORS.danger)
            .setTitle('Certamen Studios — Application Status Update')
            .setDescription(`Hello **${targetUser.displayName}**,\n\nThank you for taking the time to talk with us. Unfortunately, at this time we have decided not to move forward with your application file for the **${role.toUpperCase()}** position.\n\nWe wish you the absolute best in your future development journey.`)
            .setTimestamp();

        try { await targetUser.send({ embeds: [rejectEmbed] }); } catch {}

        const logsChan = await client.channels.fetch(CONFIG.NOT_HIRED_CHANNEL_ID).catch(() => null);
        if (logsChan) {
            const audit = new EmbedBuilder()
                .setColor(COLORS.danger)
                .setTitle('🔴 Application Record Archived')
                .addFields(
                    { name: '👤 Candidate', value: `${targetUser} (@${targetUser.username})`, inline: true },
                    { name: '🛠️ Attempted Designation', value: `\`${role.toUpperCase()}\``, inline: true }
                ).setTimestamp();
            await logsChan.send({ embeds: [audit] });
        }

        await interaction.channel.setName(`[DENIED] ${targetUser.username}`);
        await interaction.channel.setArchived(true);
    }
});

client.login(process.env.TOKEN);