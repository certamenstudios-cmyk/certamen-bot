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
    pendingReports: {} // Temp cache to store global report authorization parameters
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
    console.log(`✨ ${client.user.tag} Ultimate Private HR Operations Console is live.`);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('✅ Advanced private command interfaces synced successfully.');
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
                new ButtonBuilder().setCustomId(`prehire_${candidate.id}_${role}`).setLabel('Hire & Close').setStyle(ButtonStyle.Success).setEmoji('✅'),
                new ButtonBuilder().setCustomId(`predeny_${candidate.id}_${role}`).setLabel('Deny & Close').setStyle(ButtonStyle.Danger).setEmoji('❌')
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
//        REPORT MODAL & PRIVATE DM WORKFLOW
// ============================================

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    const [action, targetId, role] = interaction.customId.split('_');
    if (action !== 'prehire' && action !== 'predeny') return;

    // Build the Report Filing Modal Interface
    const modal = new ModalBuilder()
        .setCustomId(`reportmodal_${action}_${targetId}_${role}`)
        .setTitle('📋 File Performance Evaluation Report');

    const performanceInput = new TextInputBuilder()
        .setCustomId('report_performance')
        .setLabel('Candidate Performance Summary')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Provide a detailed summary of how the candidate performed during the live chat...')
        .setRequired(true);

    const justificationInput = new TextInputBuilder()
        .setCustomId('report_justification')
        .setLabel('Reason / Justification for Decision')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Why should this candidate be accepted or rejected? Detail strengths/weaknesses.')
        .setRequired(true);

    modal.addComponents(
        new ActionRowBuilder().addComponents(performanceInput),
        new ActionRowBuilder().addComponents(justificationInput)
    );

    await interaction.showModal(modal);
});

// Handle Report Modal Submission
client.on('interactionCreate', async interaction => {
    if (!interaction.isModalSubmit()) return;

    if (interaction.customId.startsWith('reportmodal_')) {
        await interaction.deferReply();
        const [, action, targetId, role] = interaction.customId.split('_');
        
        const performance = interaction.fields.getTextInputValue('report_performance');
        const justification = interaction.fields.getTextInputValue('report_justification');

        // Store report variables temporarily in system memory using the channel ID as the unique document key
        SYSTEM_CACHE.pendingReports[interaction.channel.id] = {
            action: action === 'prehire' ? 'HIRE' : 'DENY',
            targetId,
            role,
            interviewer: interaction.user,
            performance,
            justification,
            channel: interaction.channel
        };

        // Prompt interviewer to select other staff members to send the report to via DM
        const shareEmbed = new EmbedBuilder()
            .setColor(COLORS.warning)
            .setTitle('📝 Report Compiled Successfully!')
            .setDescription('Select the managers/co-signers below. The evaluation file will be dispatched **directly to their DMs** for private review and signature processing.');

        const userSelect = new UserSelectMenuBuilder()
            .setCustomId(`cosignselect_${interaction.channel.id}`)
            .setPlaceholder('Choose the staff members to receive this report DM...')
            .setMinValues(1)
            .setMaxValues(5); // Adjust max to allow more people if needed

        const row = new ActionRowBuilder().addComponents(userSelect);
        await interaction.editReply({ embeds: [shareEmbed], components: [row] });
    }
});

// Handle Selection of Staff Reviewers & Dispatch DMs
client.on('interactionCreate', async interaction => {
    if (!interaction.isUserSelectMenu()) return;

    if (interaction.customId.startsWith('cosignselect_')) {
        await interaction.deferUpdate();
        const threadId = interaction.customId.split('_')[1];
        const selectedStaff = interaction.users;

        const reportData = SYSTEM_CACHE.pendingReports[threadId];
        if (!reportData) return;

        let targetUser;
        try { targetUser = await client.users.fetch(reportData.targetId); } catch { return; }

        // Build the master formal document embed
        const documentEmbed = new EmbedBuilder()
            .setColor(reportData.action === 'HIRE' ? COLORS.success : COLORS.danger)
            .setTitle(`📑 HR EVALUATION DOCUMENT: ${targetUser.username}`)
            .setDescription(`**Proposed Executive Action:** \`${reportData.action} & CLOSE\`\n**Target Position:** \`${reportData.role.toUpperCase()}\``)
            .addFields(
                { name: '👤 Primary Interviewer', value: `${reportData.interviewer}`, inline: true },
                { name: '📅 Date Compiled', value: `\`${new Date().toLocaleDateString()}\``, inline: true },
                { name: '📊 Candidate Performance Summary', value: reportData.performance },
                { name: '⚖️ Action Justification', value: reportData.justification },
                { name: '🔒 Required Signatures', value: selectedStaff.map(u => `⏳ Pending DM Sign-off: ${u}`).join('\n') }
            )
            .setFooter({ text: 'Certamen Studios Dual-Authorization Private Protocol' });

        // Setup authorization trackers in internal data cache
        reportData.pendingSignatures = selectedStaff.map(u => u.id);
        reportData.signedBy = [];
        reportData.documentEmbed = documentEmbed;

        let successfullySentCount = 0;

        // Loop and dispatch separate, personalized private DMs to every single manager chosen
        for (const [_, staffUser] of selectedStaff) {
            try {
                const dmEmbed = EmbedBuilder.from(documentEmbed)
                    .setDescription(`**Attention Manager:** You have been requested by ${reportData.interviewer} to co-sign an application file.\n\n**Proposed Executive Action:** \`${reportData.action} & CLOSE\`\n**Target Position:** \`${reportData.role.toUpperCase()}\``);

                const signButton = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`pvtsign_${threadId}_${staffUser.id}`)
                        .setLabel('Approve & Sign Document')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('🖋️')
                );

                await staffUser.send({ embeds: [dmEmbed], components: [signButton] });
                successfullySentCount++;
            } catch (err) {
                // If their DMs are locked, log a fallback error inside the workspace channel
                await reportData.channel.send({ content: `⚠️ **Transmission Error:** Could not deliver report packet to ${staffUser}. They must unlock their personal Direct Messages.` });
                // Filter them out of required signature arrays so the file doesn't freeze permanently
                reportData.pendingSignatures = reportData.pendingSignatures.filter(id => id !== staffUser.id);
            }
        }

        // Update the workspace channel interaction prompt confirming dispatching actions
        if (reportData.pendingSignatures.length === 0) {
            await interaction.editReply({ content: '❌ **Operation Cancelled:** None of the chosen staff members could receive DMs.', embeds: [], components: [] });
            delete SYSTEM_CACHE.pendingReports[threadId];
        } else {
            await interaction.editReply({ content: `📨 **Private Transmission Dispatched:** The report file has been sent straight to the DMs of **${successfullySentCount}** staff members for verification processing.`, embeds: [], components: [] });
        }
    }
});

// Handle Private DM Signature Submissions
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId.startsWith('pvtsign_')) {
        const [, threadId, assignedStaffId] = interaction.customId.split('_');

        const reportData = SYSTEM_CACHE.pendingReports[threadId];
        if (!reportData) {
            return interaction.reply({ content: '❌ **Expired Session:** This evaluation file has already been finalized or closed by another administrator.', ephemeral: true });
        }

        // Security validation check
        if (interaction.user.id !== assignedStaffId) {
            return interaction.reply({ content: '⚠️ Unauthorized payload action.', ephemeral: true });
        }

        await interaction.deferUpdate();

        reportData.signedBy.push(interaction.user.id);
        reportData.pendingSignatures = reportData.pendingSignatures.filter(id => id !== interaction.user.id);

        // Edit the individual user's DM component frame layout to turn off their active button
        await interaction.editReply({ content: '✅ **Thank you.** Your digital signature has been recorded and stamped into the central file.', components: [] });

        // Update signature field on the master embed card document
        const updatedFields = reportData.documentEmbed.data.fields.map(f => {
            if (f.name === '🔒 Required Signatures') {
                const signedLines = reportData.signedBy.map(id => `✅ Signed: <@${id}>`);
                const pendingLines = reportData.pendingSignatures.map(id => `⏳ Pending DM Sign-off: <@${id}>`);
                return { name: '🔒 Required Signatures', value: [...signedLines, ...pendingLines].join('\n') };
            }
            return f;
        });

        reportData.documentEmbed.setFields(updatedFields);

        // Update the main operational workspace thread so the reviewer can track the signing status live
        await reportData.channel.send({ content: `🖋️ **Signature Update:** <@${interaction.user.id}> has verified and co-signed the document via DM.` });

        // Check if all pending DM signature requests are completed
        if (reportData.pendingSignatures.length === 0) {
            let targetUser;
            try { targetUser = await client.users.fetch(reportData.targetId); } catch { return; }

            if (SYSTEM_CACHE.activeInterviews > 0) SYSTEM_CACHE.activeInterviews--;

            reportData.documentEmbed.addFields({ name: '⚡ Executive Status', value: `🏁 **AUTHORIZED VIA PRIVATE CONSENSUS** by absolute majority vote.` });

            // Send decision to candidate and post report to logs
            if (reportData.action === 'HIRE') {
                SYSTEM_CACHE.acceptedCount++;
                const offerEmbed = new EmbedBuilder()
                    .setColor(COLORS.success)
                    .setTitle('🎉 Certamen Studios — Application Accepted!')
                    .setDescription(`Hello **${targetUser.displayName}**,\n\nWe are absolutely thrilled to inform you that you have been **ACCEPTED** into Certamen Studios for the position of **${reportData.role.toUpperCase()}**!`);

                try { await targetUser.send({ embeds: [offerEmbed] }); } catch {}

                const logsChan = await client.channels.fetch(CONFIG.HIRED_CHANNEL_ID).catch(() => null);
                if (logsChan) await logsChan.send({ embeds: [reportData.documentEmbed] });
                
                await reportData.channel.send({ content: '🏁 **All private DM approvals cleared. Candidate hired successfully.** Archiving room...' });
                await reportData.channel.setName(`[HIRED] ${targetUser.username}`);
            } else {
                SYSTEM_CACHE.rejectedCount++;
                const rejectEmbed = new EmbedBuilder()
                    .setColor(COLORS.danger)
                    .setTitle('Certamen Studios — Application Status Update')
                    .setDescription(`Hello **${targetUser.displayName}**,\n\nThank you for taking the time to talk with us. Unfortunately, at this time we have decided not to move forward with your application file.`);

                try { await targetUser.send({ embeds: [rejectEmbed] }); } catch {}

                const logsChan = await client.channels.fetch(CONFIG.NOT_HIRED_CHANNEL_ID).catch(() => null);
                if (logsChan) await logsChan.send({ embeds: [reportData.documentEmbed] });

                await reportData.channel.send({ content: '🏁 **All private DM checks processed. Candidate denied.** Archiving room...' });
                await reportData.channel.setName(`[DENIED] ${targetUser.username}`);
            }

            // Close down and archive thread completely
            await reportData.channel.setArchived(true);
            delete SYSTEM_CACHE.pendingReports[threadId];
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
        // If it's a DM, make sure it's an applicant message and not someone trying to sign a report
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