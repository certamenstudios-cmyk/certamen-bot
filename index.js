const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    UserSelectMenuBuilder,
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
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
    FORUM_CHANNEL_ID: '1509210757248581782', 
    MANAGEMENT_ROLE_ID: 'YOUR_STAFF_ROLE_ID_HERE'   
};

const COLORS = {
    neutral: '#2c2f33',
    success: '#43b581',
    danger: '#f04747',
    warning: '#faa61a',
    info: '#7289da'
};

const SYSTEM_CACHE = {
    totalInterviews: 0,
    activeInterviews: 0,
    acceptedCount: 0,
    rejectedCount: 0,
    userNotes: {},
    pendingHires: {} 
};

// Helper utility function to auto-generate a random 4-character small job code
function generateSmallJobCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

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
    console.log(`✨ ${client.user.tag} Auto-Code Engine is live.`);
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
            .setTimestamp();

        return interaction.reply({ embeds: [dashEmbed] });
    }

    if (interaction.commandName === 'notes') {
        const subcommand = interaction.options.getSubcommand();
        const target = interaction.options.getUser('target');

        if (!SYSTEM_CACHE.userNotes[target.id]) SYSTEM_CACHE.userNotes[target.id] = [];

        if (subcommand === 'add') {
            const content = interaction.options.getString('content');
            const timestampedNote = `\`[${new Date().toLocaleDateString()}]\` ${content} *(by ${interaction.user.username})*`;
            SYSTEM_CACHE.userNotes[target.id].push(timestampedNote);
            return interaction.reply({ content: `✅ Note added securely to **${target.username}'s** profile history record.`, ephemeral: true });
        }

        if (subcommand === 'view') {
            const records = SYSTEM_CACHE.userNotes[target.id];
            const notesEmbed = new EmbedBuilder()
                .setColor(COLORS.warning)
                .setTitle(`📝 Evaluation History: ${target.username}`)
                .setDescription(records.length > 0 ? records.join('\n') : '*No background evaluation flags or custom notes logged on file.*');
            return interaction.reply({ embeds: [notesEmbed], ephemeral: true });
        }
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
//         DECISION HANDLING MECHANICS
// ============================================

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    const [action, targetId, role] = interaction.customId.split('_');
    if (action !== 'hire' && action !== 'deny') return;

    // --- CASE A: IMMEDIATE DENIAL SEQUENCE ---
    if (action === 'deny') {
        await interaction.deferReply({ ephemeral: true });
        let targetUser;
        try { targetUser = await client.users.fetch(targetId); } catch { return; }

        if (SYSTEM_CACHE.activeInterviews > 0) SYSTEM_CACHE.activeInterviews--;
        SYSTEM_CACHE.rejectedCount++;

        const rejectEmbed = new EmbedBuilder()
            .setColor(COLORS.danger)
            .setTitle('Certamen Studios — Application Status Update')
            .setDescription(`Hello **${targetUser.displayName}**,\n\nThank you for taking the time to talk with us. Unfortunately, at this time we have decided not to move forward with your application file.`);

        try { await targetUser.send({ embeds: [rejectEmbed] }); } catch {}

        const logsChan = await client.channels.fetch(CONFIG.NOT_HIRED_CHANNEL_ID).catch(() => null);
        if (logsChan) {
            const formattedTime = `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            const visualAuditEmbed = new EmbedBuilder()
                .setColor(COLORS.danger)
                .setTitle('🔴 Application Record Archived')
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: '👤 Candidate', value: `${targetUser}\n(${targetUser.username})`, inline: true },
                    { name: '🛠️ Attempted Designation', value: `\`${role.toUpperCase()}\``, inline: true }
                )
                .setFooter({ text: `Processed by HR Agent: ${interaction.user.username} • ${formattedTime}` });

            await logsChan.send({ embeds: [visualAuditEmbed] });
        }

        await interaction.editReply({ content: '🏁 **Candidate denied. Session archived.**' });
        await interaction.channel.setName(`[DENIED] ${targetUser.username}`);
        await interaction.channel.setArchived(true);
        return;
    }

    // --- CASE B: HIRE INPUT MODAL SEQUENCING ---
    if (action === 'hire') {
        const modal = new ModalBuilder()
            .setCustomId(`hiremodal_${targetId}_${role}`)
            .setTitle('📝 Enter Performance Score');

        // Job code is now generated automatically, removing text input component completely
        const scoreInput = new TextInputBuilder()
            .setCustomId('metrics_passrate')
            .setLabel('Pass Rate (%)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('e.g., 94%')
            .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(scoreInput));
        await interaction.showModal(modal);
    }
});

// Handle Hiring Metrics Submission & Prompt Manager Routing
client.on('interactionCreate', async interaction => {
    if (!interaction.isModalSubmit()) return;

    if (interaction.customId.startsWith('hiremodal_')) {
        await interaction.deferReply();
        const [, targetId, role] = interaction.customId.split('_');

        const passRate = interaction.fields.getTextInputValue('metrics_passrate');
        
        // Auto-generating the small random job code right here 
        const generatedCode = generateSmallJobCode();

        SYSTEM_CACHE.pendingHires[interaction.channel.id] = {
            targetId,
            role,
            jobCode: generatedCode,
            passRate,
            hrAgent: interaction.user,
            channel: interaction.channel
        };

        const routingEmbed = new EmbedBuilder()
            .setColor(COLORS.warning)
            .setTitle('💼 Select Assignment Manager')
            .setDescription(`Metrics captured successfully! (Job Code generated: \`${generatedCode}\`). Select the specific manager below who should be notified to establish contact with the new employee.`);

        const managerSelect = new UserSelectMenuBuilder()
            .setCustomId(`routepm_${interaction.channel.id}`)
            .setPlaceholder('Choose a manager to handle contact assignment...')
            .setMinValues(1)
            .setMaxValues(1);

        const row = new ActionRowBuilder().addComponents(managerSelect);
        await interaction.editReply({ embeds: [routingEmbed], components: [row] });
    }
});

// Finalize Assignment Routing, DM Manager, and Publish Clean Panel Card
client.on('interactionCreate', async interaction => {
    if (!interaction.isUserSelectMenu()) return;

    if (interaction.customId.startsWith('routepm_')) {
        await interaction.deferUpdate();
        const threadId = interaction.customId.split('_')[1];
        const selectedManager = interaction.users.first();

        const hireData = SYSTEM_CACHE.pendingHires[threadId];
        if (!hireData) return;

        let targetUser;
        try { targetUser = await client.users.fetch(hireData.targetId); } catch { return; }

        if (SYSTEM_CACHE.activeInterviews > 0) SYSTEM_CACHE.activeInterviews--;
        SYSTEM_CACHE.acceptedCount++;

        const formattedTime = `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

        // Build the precise panel card matched directly to your image layout
        const fineAuditCardEmbed = new EmbedBuilder()
            .setColor(COLORS.success)
            .setTitle('🟢 New Talent Recruited')
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '👤 Employee', value: `${targetUser}\n(${targetUser.username})`, inline: true },
                { name: '🛠️ Assigned Designation', value: `\`${hireData.role.toUpperCase()}\``, inline: true },
                { name: '🏷️ Job Code', value: `\`${hireData.jobCode}\``, inline: true },
                { name: '📊 Pass Rate', value: `\`${hireData.passRate}\``, inline: true }
            )
            .setFooter({ text: `Processed by HR Agent: ${hireData.hrAgent.username} • ${formattedTime}` });

        // A) Push formal copy to target logs channel configuration settings
        const logsChan = await client.channels.fetch(CONFIG.HIRED_CHANNEL_ID).catch(() => null);
        if (logsChan) {
            await logsChan.send({ embeds: [fineAuditCardEmbed] });
        }

        // B) Forward file parameters straight to chosen manager DMs
        try {
            const managerAlertEmbed = EmbedBuilder.from(fineAuditCardEmbed)
                .setTitle('📥 Action Required: New Onboarding Assignment')
                .setDescription(`Greetings **${selectedManager.username}**,\n\nYou have been designated to contact this newly accepted candidate to handle documentation layout setups.`);
            await selectedManager.send({ embeds: [managerAlertEmbed] });
        } catch {
            await hireData.channel.send({ content: `⚠️ **Warning:** Could not send private alert to ${selectedManager} (DMs locked).` });
        }

        // C) Message the Candidate their general confirmation
        try {
            const offerEmbed = new EmbedBuilder()
                .setColor(COLORS.success)
                .setTitle('🎉 Certamen Studios — Application Accepted!')
                .setDescription(`Hello **${targetUser.displayName}**,\n\nWe are absolutely thrilled to inform you that you have been **ACCEPTED** into Certamen Studios for the position of **${hireData.role.toUpperCase()}**! A manager (<@${selectedManager.id}>) will reach out to you shortly.`);
            await targetUser.send({ embeds: [offerEmbed] });
        } catch {}

        // Complete workspace session management
        await hireData.channel.send({ content: `🏁 **File finalized.** Small job code generated [\`${hireData.jobCode}\`] and dispatched to manager ${selectedManager}. Archiving room...` });
        await hireData.channel.setName(`[HIRED] ${targetUser.username}`);
        await hireData.channel.setArchived(true);
        
        delete SYSTEM_CACHE.pendingHires[threadId];
        await interaction.editReply({ content: '📨 **Success:** Profile compiled and dispatched.', embeds: [], components: [] });
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
        }
    }
});

client.login(process.env.TOKEN);