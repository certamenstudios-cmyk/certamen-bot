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
    info: '#7289da',
    purple: '#9b59b6' 
};

const SYSTEM_CACHE = {
    totalInterviews: 0,
    activeInterviews: 0,
    acceptedCount: 0,
    rejectedCount: 0,
    pendingHires: {},
    aiModeActive: {},    
    activeDrafts: {}     
};

function generateSmallJobCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function generateAIResponseToUser(applicantMessage, roleType) {
    const roleName = roleType ? roleType.toUpperCase() : "DEVELOPER";
    const text = applicantMessage.toLowerCase();
    
    if (text.includes('hello') || text.includes('hi') || text.includes('hey')) {
        return `Hello! Welcome to your interview session. We are reviewing candidates for the **${roleName}** position at Certamen Studios. To get things started, could you share a bit about your background and some of your favorite projects you've worked on?`;
    }
    if (text.includes('portfolio') || text.includes('work') || text.includes('showcase') || text.includes('link')) {
        return `Thanks for providing that context! Your portfolio layout looks highly impressive. In this **${roleName}** role, we focus heavily on clean asset organization and teamwork. Can you tell me about a time you had to adapt your style to fit a specific group project requirement?`;
    }
    if (text.includes('pay') || text.includes('robux') || text.includes('salary') || text.includes('earn')) {
        return `Great question. Regarding compensation: all project milestone structures, rates, and payouts are finalized right after passing this interview stage. If you're brought onto the team, a manager will set up your official payment file. Do you have any other questions about our studio environment or team pipelines?`;
    }
    if (text.includes('what do i') || text.includes('how do i') || text.includes('next step')) {
        return `The next step is simple! We're evaluating your core skills for **${roleName}**. Could you describe your general availability throughout the week and how you usually manage tight deadlines?`;
    }
    
    return `Thank you for sharing that with us! That makes complete sense. Given our high design standards for **${roleName}** assets, how do you approach testing your work to make sure it's fully optimized and bug-free before submitting it?`;
}

// ============================================
//         COMMAND REGISTRATION ENGINE
// ============================================
const commands = [
    new SlashCommandBuilder()
        .setName('interview')
        .setDescription('Open a live-chat forum thread bridge for an applicant')
        .addUserOption(option => option.setName('candidate').setDescription('Select target applicant').setRequired(true)),
    new SlashCommandBuilder()
        .setName('aiassist')
        .setDescription('Toggle the AI Writing Copilot draft mode ON or OFF for this workspace channel'),
    new SlashCommandBuilder()
        .setName('dashboard')
        .setDescription('View the live deployment metrics dashboard for HR operations'),
    new SlashCommandBuilder()
        .setName('onboard')
        .setDescription('Manually onboard a candidate outside of an active interview channel workflow')
        .addUserOption(option => option.setName('candidate').setDescription('The user being accepted').setRequired(true))
        .addStringOption(option => option.setName('role').setDescription('The deployment discipline').setRequired(true).addChoices(
            { name: 'Programming & Scripting', value: 'scripter' },
            { name: 'Environmental Design & Building', value: 'builder' },
            { name: 'User Interface & Graphic Design', value: 'ui_designer' },
            { name: 'Project Quality & Management', value: 'management' }
        ))
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
    console.log(`✨ ${client.user.tag} Baseline AI Assist & Standalone Onboarding Core Active.`);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    } catch (error) {
        console.error('❌ Sync failed:', error);
    }
});

// ============================================
//          INTERACTION CORE CONTROLLER
// ============================================
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // AI ASSIST TOGGLE ROUTER
    if (interaction.commandName === 'aiassist') {
        if (!interaction.channel.isThread() || interaction.channel.parent?.id !== CONFIG.FORUM_CHANNEL_ID) {
            return interaction.reply({ content: '❌ This tool can only be used inside an active interview thread workspace.', ephemeral: true });
        }

        const threadId = interaction.channel.id;
        const currentMode = SYSTEM_CACHE.aiModeActive[threadId] || false;
        SYSTEM_CACHE.aiModeActive[threadId] = !currentMode;

        const toggleStatusEmbed = new EmbedBuilder()
            .setAuthor({ name: '⚡ System Status Core Router', iconURL: client.user.displayAvatarURL() });

        if (SYSTEM_CACHE.aiModeActive[threadId]) {
            toggleStatusEmbed
                .setColor(COLORS.purple)
                .setTitle('🔮 AUTOMATION ENGINE: INITIALIZED')
                .setDescription([
                    '```glsl',
                    '# SYSTEM CONFIG STABLE',
                    'STATUS: INTERCEPT MODE ENABLED',
                    '```',
                    '┌── **Operational Mode Details**',
                    '├── » *AI Copilot is now parsing live text input streams.*',
                    '└── » *Incoming candidate messages will generate real-time pending drafts.*'
                ].join('\n'));
        } else {
            toggleStatusEmbed
                .setColor(COLORS.neutral)
                .setTitle('⚙️ AUTOMATION ENGINE: DEACTIVATED')
                .setDescription([
                    '```yaml',
                    'status: STANDBY',
                    'mode: MANUAL_OVERRIDE',
                    '```',
                    '┌── **Operational Mode Details**',
                    '└── » *Automated copilot response generators are offline. Manual entry required.*'
                ].join('\n'));
        }

        return interaction.reply({ embeds: [toggleStatusEmbed] });
    }

    // INTERVIEW SETUP 
    if (interaction.commandName === 'interview') {
        const candidate = interaction.options.getUser('candidate');

        const selectionEmbed = new EmbedBuilder()
            .setColor(COLORS.info)
            .setTitle('📂 Deployment Hub ── Assign Department')
            .setDescription(`Select the operational group or project workflow domain for **${candidate.username}** below to spin up their network layout file.`);

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

    // METRICS DASHBOARD
    if (interaction.commandName === 'dashboard') {
        const dashEmbed = new EmbedBuilder()
            .setColor(COLORS.neutral)
            .setTitle('🖥️ Operational Performance Analytics')
            .setDescription('`📊 Live Network Diagnostics Log` ── Updates Active')
            .addFields(
                { name: '📥 Active Message Channels', value: `\`▰▰▰▰▱▱▱▱▱▱ 40%\`\n» **${SYSTEM_CACHE.activeInterviews}** Active Sessions`, inline: true },
                { name: '📦 Cumulative Processed Logs', value: `\`▰▰▰▰▰▰▰▱▱▱ 70%\`\n» **${SYSTEM_CACHE.totalInterviews}** Total Streams`, inline: true }
            );
        return interaction.reply({ embeds: [dashEmbed] });
    }

    // FREE-STANDING OFF-CHAT MANUAL ONBOARD COMMAND
    if (interaction.commandName === 'onboard') {
        const candidate = interaction.options.getUser('candidate');
        const role = interaction.options.getString('role');

        const modal = new ModalBuilder()
            .setCustomId(`manualhiremodal_${candidate.id}_${role}`)
            .setTitle('📝 Enter Performance Score');

        const scoreInput = new TextInputBuilder()
            .setCustomId('metrics_passrate')
            .setLabel('Pass Rate (%)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('e.g., 95%')
            .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(scoreInput));
        await interaction.showModal(modal);
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
                .setTitle(`📶 Network Tunnel Linked ── ${candidate.username}`)
                .setDescription([
                    '```ansi',
                    '[1;34m[READY][0m Communications routing tunnel configured smoothly.',
                    '```',
                    '### 🛠️ Protocol Infrastructure:',
                    '┌── **Direct Route Instructions**',
                    '├── » *Standard texts typed directly below transfer instantly into user DMs.*',
                    '├── » *Toggle automated drafting features using* `/aiassist` *at any time.*',
                    '└── » *Candidate responses are piped directly back to this control feed workspace.*'
                ].join('\n'))
                .addFields(
                    { name: '🆔 Core System ID', value: `\`${candidate.id}\``, inline: true },
                    { name: '💼 Assigned Discipline', value: `\`${role.toUpperCase()}\``, inline: true }
                );

            const actionRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`hire_${candidate.id}_${role}`).setLabel('Finalize Hire').setStyle(ButtonStyle.Success).setEmoji('✅'),
                new ButtonBuilder().setCustomId(`deny_${candidate.id}_${role}`).setLabel('Drop Candidate').setStyle(ButtonStyle.Danger).setEmoji('❌')
            );

            const thread = await forumChannel.threads.create({
                name: threadName,
                autoArchiveDuration: 1440,
                message: {
                    content: `🎙️ **Session Node Online:** Terminal channel built for ${candidate}.`,
                    embeds: [threadEmbed],
                    components: [actionRow]
                }
            });

            SYSTEM_CACHE.totalInterviews++;
            SYSTEM_CACHE.activeInterviews++;
            SYSTEM_CACHE.aiModeActive[thread.id] = true;

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

    const parts = interaction.customId.split('_');
    const action = parts[0];
    const targetId = parts[1];
    const role = parts[2];
    
    if (action === 'aipass' || action === 'aidrop') {
        await interaction.deferUpdate();
        const cachedPayload = SYSTEM_CACHE.activeDrafts[interaction.message.id];
        if (!cachedPayload) return;

        if (action === 'aipass') {
            try {
                const targetUser = await client.users.fetch(cachedPayload.candidateId);
                const outboundEmbed = new EmbedBuilder()
                    .setColor(COLORS.neutral)
                    .setAuthor({ name: `Message from Arya (HR Representative)`, iconURL: cachedPayload.senderAvatar })
                    .setDescription(cachedPayload.draftText)
                    .setTimestamp();

                await targetUser.send({ embeds: [outboundEmbed] });
                
                const logConfirmation = new EmbedBuilder()
                    .setColor(COLORS.success)
                    .setTitle('🚀 TRANSACTION CLEARANCE EXECUTED')
                    .setDescription([
                        '```ansi',
                        '[1;32m[DISPATCHED][0m Response pipeline cleared out successfully.',
                        '```',
                        `**Forwarded Output Frame:**\n> ${cachedPayload.draftText}`
                    ].join('\n'));
                
                await interaction.message.edit({ embeds: [logConfirmation], components: [] });
            } catch (error) {
                await interaction.followUp({ content: '❌ **Message Drop Failed:** Candidate DMs locked.', ephemeral: true });
            }
        } else {
            const dropEmbed = new EmbedBuilder()
                .setColor(COLORS.danger)
                .setTitle('🗑️ DISCARD OPERATIONS REGISTERED')
                .setDescription('```diff\n- Core target draft deleted from live queues.\n```');
            await interaction.message.edit({ embeds: [dropEmbed], components: [] });
        }

        delete SYSTEM_CACHE.activeDrafts[interaction.message.id];
        return;
    }

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
            const visualAuditEmbed = new EmbedBuilder()
                .setColor(COLORS.danger)
                .setTitle('🔴 System Repository Compiling Archive')
                .setDescription('`🔒 Compressing Application Session File Blocks`')
                .addFields(
                    { name: '👤 Candidate File', value: `${targetUser}\n(${targetUser.username})`, inline: true },
                    { name: '🛠️ Target Role', value: `\`${role.toUpperCase()}\``, inline: true }
                );
            await logsChan.send({ embeds: [visualAuditEmbed] });
        }

        await interaction.editReply({ content: '🏁 **Candidate denied. Session archived.**' });
        await interaction.channel.setName(`[DENIED] ${targetUser.username}`);
        await interaction.channel.setArchived(true);
    }

    if (action === 'hire') {
        const modal = new ModalBuilder()
            .setCustomId(`hiremodal_${targetId}_${role}`)
            .setTitle('📝 Enter Performance Score');

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

// MODAL HANDLING PROTOCOL
client.on('interactionCreate', async interaction => {
    if (!interaction.isModalSubmit()) return;

    if (interaction.customId.startsWith('hiremodal_') || interaction.customId.startsWith('manualhiremodal_')) {
        await interaction.deferReply();
        const isManual = interaction.customId.startsWith('manualhiremodal_');
        
        const parts = interaction.customId.split('_');
        const targetId = parts[1];
        const role = parts[2];

        const passRate = interaction.fields.getTextInputValue('metrics_passrate');
        const generatedCode = generateSmallJobCode();

        const cacheKey = isManual ? `manual_${interaction.id}` : interaction.channel.id;

        SYSTEM_CACHE.pendingHires[cacheKey] = {
            targetId,
            role,
            jobCode: generatedCode,
            passRate,
            hrAgent: interaction.user,
            isManual: isManual,
            channel: isManual ? null : interaction.channel
        };

        const routingEmbed = new EmbedBuilder()
            .setColor(COLORS.warning)
            .setTitle('💼 Select Assignment Manager')
            .setDescription(`Metrics captured! (Job Code: \`${generatedCode}\`). Choose the designated project manager below to handle onboarding routing.`);

        const managerSelect = new UserSelectMenuBuilder()
            .setCustomId(`routepm_${cacheKey}`)
            .setPlaceholder('Choose a manager...')
            .setMinValues(1)
            .setMaxValues(1);

        const row = new ActionRowBuilder().addComponents(managerSelect);
        await interaction.editReply({ embeds: [routingEmbed], components: [row] });
    }
});

// FINALIZE ROUTING ASSIGNMENT
client.on('interactionCreate', async interaction => {
    if (!interaction.isUserSelectMenu()) return;

    if (interaction.customId.startsWith('routepm_')) {
        await interaction.deferUpdate();
        const cacheKey = interaction.customId.split('_')[1];
        const selectedManager = interaction.users.first();

        const hireData = SYSTEM_CACHE.pendingHires[cacheKey];
        if (!hireData) return;

        let targetUser;
        try { targetUser = await client.users.fetch(hireData.targetId); } catch { return; }

        if (!hireData.isManual && SYSTEM_CACHE.activeInterviews > 0) {
            SYSTEM_CACHE.activeInterviews--;
        }
        SYSTEM_CACHE.acceptedCount++;

        const fineAuditCardEmbed = new EmbedBuilder()
            .setColor(COLORS.success)
            .setTitle('🟢 Roster File Insertion Executed')
            .setDescription('`⚡ Transferring operational system permissions cards...`')
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '👤 Employed Talent', value: `${targetUser}\n(${targetUser.username})`, inline: true },
                { name: '🛠️ Core Role', value: `\`${hireData.role.toUpperCase()}\``, inline: true },
                { name: '🏷️ Assigned Code', value: `\`${hireData.jobCode}\``, inline: true },
                { name: '📊 Matrix Output', value: `\`${hireData.passRate}\``, inline: true }
            );

        const logsChan = await client.channels.fetch(CONFIG.HIRED_CHANNEL_ID).catch(() => null);
        if (logsChan) await logsChan.send({ embeds: [fineAuditCardEmbed] });

        try { await selectedManager.send({ embeds: [fineAuditCardEmbed] }); } catch {}

        try {
            const offerEmbed = new EmbedBuilder()
                .setColor(COLORS.success)
                .setTitle('🎉 Certamen Studios — Application Accepted!')
                .setDescription(`Hello **${targetUser.displayName}**,\n\nWe are absolutely thrilled to inform you that you have been **ACCEPTED** into Certamen Studios for the position of **${hireData.role.toUpperCase()}**! A manager (<@${selectedManager.id}>) will reach out shortly.`);
            await targetUser.send({ embeds: [offerEmbed] });
        } catch {}

        if (!hireData.isManual && hireData.channel) {
            await hireData.channel.send({ content: `🏁 **File finalized.** Job code generated [\`${hireData.jobCode}\`] and dispatched to manager.` });
            await hireData.channel.setName(`[HIRED] ${targetUser.username}`);
            await hireData.channel.setArchived(true);
        }
        
        delete SYSTEM_CACHE.pendingHires[cacheKey];
        await interaction.message.edit({ content: '📨 **Success:** Onboarding profile compiled and dispatched safely.', embeds: [], components: [] });
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

        const idField = startMessage.embeds[0].fields.find(f => f.name === '🆔 Core System ID');
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
        let roleType = '';
        for (const [_, thread] of activeThreads.threads) {
            const starter = await thread.fetchStarterMessage().catch(() => null);
            if (starter && starter.embeds[0]) {
                const idField = starter.embeds[0].fields.find(f => f.name === '🆔 Core System ID');
                const roleField = starter.embeds[0].fields.find(f => f.name === '💼 Assigned Discipline');
                if (idField && idField.value.replace(/`/g, '') === message.author.id) {
                    targetThread = thread;
                    roleType = roleField ? roleField.value.replace(/`/g, '') : '';
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

            if (SYSTEM_CACHE.aiModeActive[targetThread.id]) {
                const calculatingEmbed = new EmbedBuilder()
                    .setColor(COLORS.purple)
                    .setTitle('🤖 CONVERSATIONAL CORE: THINKING')
                    .setDescription([
                        '`▰▰▰▰▰▰▰▱▱▱ 70%` Evaluating candidate inputs...',
                        '```ansi',
                        '[1;35m[PROCESSING][0m Formulating context-appropriate solution response frames...',
                        '```'
                    ].join('\n'));

                const placeholderMsg = await targetThread.send({ embeds: [calculatingEmbed] });

                const suggestedAIResponse = generateAIResponseToUser(message.content, roleType);

                const aiDraftCard = new EmbedBuilder()
                    .setColor(COLORS.purple)
                    .setTitle('🤖 CONVERSATIONAL CORE: ANALYSIS COMPLETE')
                    .setDescription([
                        `**Applicant Input Node:** *"${message.content}"*`,
                        '```ansi',
                        '[1;32m[PROPOSAL STABLE][0m Recommended transmission generation loaded below.',
                        '```',
                        '### 📝 Formulated System Reply Draft:',
                        `${suggestedAIResponse}`
                    ].join('\n'))
                    .setFooter({ text: 'Review pipeline authorization buttons below to forward or drop this draft block.' });

                const draftButtonsRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`aipass_${message.author.id}`).setLabel('Approve & Send').setStyle(ButtonStyle.Purple).setEmoji('🚀'),
                    new ButtonBuilder().setCustomId(`aidrop_${message.author.id}`).setLabel('Reject Draft').setStyle(ButtonStyle.Danger).setEmoji('🗑️')
                );

                await placeholderMsg.edit({ embeds: [aiDraftCard], components: [draftButtonsRow] });

                SYSTEM_CACHE.activeDrafts[placeholderMsg.id] = {
                    candidateId: message.author.id,
                    draftText: suggestedAIResponse,
                    senderAvatar: client.user.displayAvatarURL() 
                };
            }
        }
    }
});

client.login(process.env.TOKEN);