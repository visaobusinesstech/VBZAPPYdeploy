import BullQueue from "bull";
import { Op } from "sequelize";
import { REDIS_URI_CONNECTION } from "./config/redis";
import EmailSchedule from "./models/EmailSchedule";
import EmailCampaign from "./models/EmailCampaign";
import EmailTemplate from "./models/EmailTemplate";
import EmailContact from "./models/EmailContact";
import EmailLog from "./models/EmailLog";
import EmailAnalytics from "./models/EmailAnalytics";
import SmtpConfig from "./models/SmtpConfig";
import { getCompanyTransporter } from "./helpers/SmtpTransport";

const connection = REDIS_URI_CONNECTION;

const USE_REDIS = !!(connection && connection !== "");

let emailSendQueue: BullQueue.Queue | null = null;
let emailScheduler: BullQueue.Queue | null = null;

if (USE_REDIS) {
  emailSendQueue = new BullQueue("EmailSendQueue", connection);
  emailScheduler = new BullQueue("EmailScheduler", connection);
}

async function processEmailSend(job: any) {
  const { scheduleId } = job.data;
  const schedule = await EmailSchedule.findByPk(scheduleId, {
    include: [{ model: EmailCampaign, as: "campaign", include: [{ model: EmailTemplate, as: "template" }] }, { model: EmailContact, as: "contact" }]
  });
  if (!schedule) return;
  if (schedule.status !== "scheduled" && schedule.status !== "retrying") return;
  try {
    const companyId = schedule.companyId;
    const transporter = await getCompanyTransporter(companyId);
    const smtpConfig = await SmtpConfig.findOne({ where: { companyId, isDefault: true } });
    const from = process.env.MAIL_FROM || smtpConfig?.smtpUsername || undefined;
    const subject = (schedule as any).campaign?.subject || (schedule as any).campaign?.template?.subject || "";
    const html = (schedule as any).campaign?.template?.contentHtml || null;
    const text = (schedule as any).campaign?.template?.contentText || undefined;
    const to = (schedule as any).contact?.email || null;
    if (!to) throw new Error("NO_RECIPIENT");
    await transporter.sendMail({ from, to, subject, html: html || undefined, text });
    await schedule.update({ status: "sent", sentAt: new Date(), errorMessage: null });
    await EmailLog.create({
      companyId,
      campaignId: schedule.campaignId,
      contactId: schedule.contactId,
      sentAt: new Date()
    } as any);
    const dateKey = new Date().toISOString().slice(0, 10);
    const [an] = await EmailAnalytics.findOrCreate({ where: { companyId, date: dateKey }, defaults: { totalSent: 0, totalOpened: 0, totalClicked: 0, totalBounced: 0, unsubscribeCount: 0 } as any });
    await an.update({ totalSent: an.totalSent + 1 });
  } catch (e: any) {
    const retries = (schedule.retryCount || 0) + 1;
    const willRetry = retries <= 3;
    await schedule.update({ status: willRetry ? "retrying" : "failed", errorMessage: String(e?.message || e), retryCount: retries });
    if (willRetry) {
      const delayMs = Math.min(300000, 10000 * retries);
      await emailSendQueue.add({ scheduleId: schedule.id }, { delay: delayMs, removeOnComplete: true });
    }
  }
}

async function handleEmailScheduler() {
  const due = await EmailSchedule.findAll({
    where: {
      status: "scheduled",
      scheduledAt: { [Op.lte]: new Date() }
    },
    limit: 200
  } as any);
  if (USE_REDIS && emailSendQueue) {
    for (const s of due) {
      await emailSendQueue.add({ scheduleId: s.id }, { removeOnComplete: true });
    }
  } else {
    for (const s of due) {
      await processEmailSend({ data: { scheduleId: s.id } } as any);
    }
  }
}

if (USE_REDIS && emailSendQueue && emailScheduler) {
  emailSendQueue.process(processEmailSend as any);
  emailScheduler.add(
    "ScanDueEmailSchedules",
    {},
    { repeat: { cron: "*/30 * * * * *", key: "scan-email-schedules" }, removeOnComplete: true }
  );
  emailScheduler.process(async () => {
    await handleEmailScheduler();
  });
} else {
  setInterval(() => {
    handleEmailScheduler().catch(() => {});
  }, 30 * 1000);
}

export { emailSendQueue, emailScheduler };
