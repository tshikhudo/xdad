import type { Express, Request, Response } from "express";
import twilio from "twilio";
import { storage } from "./storage";
import { HOUSE_SIZES, TASKS, AVAILABILITY_WINDOWS, AREAS, calculatePrice as sharedCalculatePrice } from "@shared/schema";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_WHATSAPP_NUMBER;

interface ConversationState {
  step: "start" | "house_size" | "tasks" | "availability" | "date" | "area" | "confirm" | "complete";
  houseSize?: string;
  tasks?: string[];
  availabilityWindow?: string;
  date?: string;
  area?: string;
  phone: string;
  lastActivity: number;
}

const conversations = new Map<string, ConversationState>();

const CONVERSATION_TIMEOUT = 30 * 60 * 1000;

function cleanupOldConversations() {
  const now = Date.now();
  const toDelete: string[] = [];
  conversations.forEach((state, phone) => {
    if (now - state.lastActivity > CONVERSATION_TIMEOUT) {
      toDelete.push(phone);
    }
  });
  toDelete.forEach(phone => conversations.delete(phone));
}

setInterval(cleanupOldConversations, 5 * 60 * 1000);

function getOrCreateConversation(phone: string): ConversationState {
  let state = conversations.get(phone);
  if (!state) {
    state = {
      step: "start",
      phone,
      tasks: [],
      lastActivity: Date.now(),
    };
    conversations.set(phone, state);
  }
  state.lastActivity = Date.now();
  return state;
}

function formatHouseSizeOptions(): string {
  return HOUSE_SIZES.map((size, i) => `${i + 1}. ${size.key} (${size.bedrooms} bedrooms)`).join("\n");
}

function formatTaskOptions(): string {
  return TASKS.map((task, i) => `${i + 1}. ${task.key.replace(/_/g, " ")}`).join("\n");
}

function formatAvailabilityOptions(): string {
  return AVAILABILITY_WINDOWS.map((w, i) => `${i + 1}. ${w.label}`).join("\n");
}

function formatAreaOptions(): string {
  return AREAS.slice(0, 10).map((area, i) => `${i + 1}. ${area}`).join("\n") + "\n\nOr type your area name.";
}

function formatDateOptions(): string {
  return "1. Today\n2. Tomorrow\n\nOr type a date (e.g., 15 Jan)";
}

async function calculatePriceForState(state: ConversationState): Promise<{ price: number; workerPayout: number }> {
  const pricing = await storage.getPricingRules();
  if (!pricing || !state.houseSize || !state.tasks || state.tasks.length === 0) {
    return { price: 0, workerPayout: 0 };
  }
  
  const validHouseSize = HOUSE_SIZES.find(h => h.key === state.houseSize);
  const validTasks = state.tasks.filter(t => TASKS.find(task => task.key === t));
  
  if (!validHouseSize || validTasks.length === 0) {
    return { price: 0, workerPayout: 0 };
  }
  
  const houseSizeMultipliers = typeof pricing.houseSizeMultipliers === 'string' 
    ? JSON.parse(pricing.houseSizeMultipliers) 
    : pricing.houseSizeMultipliers;
  const taskWeights = typeof pricing.taskWeights === 'string' 
    ? JSON.parse(pricing.taskWeights) 
    : pricing.taskWeights;
  
  const price = sharedCalculatePrice(
    state.houseSize as "small" | "medium" | "large",
    validTasks as Array<"general_cleaning" | "ironing" | "laundry" | "windows" | "deep_clean">,
    pricing.basePrice,
    houseSizeMultipliers,
    taskWeights
  );
  const workerPayout = Math.round(price * (pricing.workerPayoutPercent / 100));
  
  return { price, workerPayout };
}

function getDateFromChoice(choice: string): string {
  const today = new Date();
  switch (choice) {
    case "1":
    case "today":
      return today.toISOString().split("T")[0];
    case "2":
    case "tomorrow":
      today.setDate(today.getDate() + 1);
      return today.toISOString().split("T")[0];
    default:
      const parsed = new Date(choice);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split("T")[0];
      }
      return today.toISOString().split("T")[0];
  }
}

async function processMessage(phone: string, message: string): Promise<string> {
  const state = getOrCreateConversation(phone);
  const input = message.toLowerCase().trim();
  
  if (input === "cancel" || input === "restart" || input === "start over") {
    conversations.delete(phone);
    return "Booking cancelled. Send 'hi' to start a new booking.";
  }
  
  switch (state.step) {
    case "start":
      state.step = "house_size";
      return `Welcome to MaidSync!

Let's book a cleaner for you.

*What size is your home?*
${formatHouseSizeOptions()}

Reply with a number (1-3)`;

    case "house_size":
      const sizeIndex = parseInt(input) - 1;
      if (sizeIndex >= 0 && sizeIndex < HOUSE_SIZES.length) {
        state.houseSize = HOUSE_SIZES[sizeIndex].key;
        state.step = "tasks";
        return `Great! Home size: *${HOUSE_SIZES[sizeIndex].key} (${HOUSE_SIZES[sizeIndex].bedrooms} bedrooms)*

*What tasks do you need?*
${formatTaskOptions()}

Reply with numbers separated by commas (e.g., 1,2,3)`;
      }
      return `Please reply with a number (1-${HOUSE_SIZES.length}):\n${formatHouseSizeOptions()}`;

    case "tasks":
      const taskIndices = input.split(",").map(s => parseInt(s.trim()) - 1);
      const validTasks = taskIndices.filter(i => i >= 0 && i < TASKS.length);
      if (validTasks.length > 0) {
        state.tasks = validTasks.map(i => TASKS[i].key);
        state.step = "availability";
        const taskNames = validTasks.map(i => TASKS[i].key.replace(/_/g, " ")).join(", ");
        return `Tasks selected: *${taskNames}*

*When do you need the cleaner?*
${formatAvailabilityOptions()}

Reply with a number (1-3)`;
      }
      return `Please select at least one task:\n${formatTaskOptions()}\n\nReply with numbers (e.g., 1,2)`;

    case "availability":
      const availIndex = parseInt(input) - 1;
      if (availIndex >= 0 && availIndex < AVAILABILITY_WINDOWS.length) {
        state.availabilityWindow = AVAILABILITY_WINDOWS[availIndex].key;
        state.step = "date";
        return `Time: *${AVAILABILITY_WINDOWS[availIndex].label}*

*What date?*
${formatDateOptions()}

Reply with a number (1-4)`;
      }
      return `Please reply with a number (1-${AVAILABILITY_WINDOWS.length}):\n${formatAvailabilityOptions()}`;

    case "date":
      state.date = getDateFromChoice(input);
      state.step = "area";
      return `Date: *${state.date}*

*Where is your home?*
${formatAreaOptions()}`;

    case "area":
      const areaIndex = parseInt(input) - 1;
      if (areaIndex >= 0 && areaIndex < AREAS.length) {
        state.area = AREAS[areaIndex];
      } else {
        const matchedArea = AREAS.find(a => a.toLowerCase().includes(input));
        state.area = matchedArea || input;
      }
      state.step = "confirm";
      
      const { price, workerPayout } = await calculatePriceForState(state);
      
      const houseSize = HOUSE_SIZES.find(h => h.key === state.houseSize);
      return `*Booking Summary*
Area: ${state.area}
Home: ${houseSize?.key} (${houseSize?.bedrooms} bedrooms)
Tasks: ${state.tasks?.map(t => t.replace(/_/g, " ")).join(", ")}
Time: ${AVAILABILITY_WINDOWS.find(w => w.key === state.availabilityWindow)?.label}
Date: ${state.date}

*Total Price: R${price}*

Reply *YES* to confirm or *NO* to cancel.`;

    case "confirm":
      if (input === "yes" || input === "y" || input === "confirm") {
        const { price, workerPayout } = await calculatePriceForState(state);
        
        let employer = await storage.getEmployerByPhone(phone);
        if (!employer) {
          employer = await storage.createEmployer({
            name: "WhatsApp User",
            phone,
            area: state.area || "",
          });
        }
        
        const job = await storage.createJob({
          employerId: employer.id,
          houseSize: state.houseSize!,
          tasks: state.tasks!,
          availabilityWindow: state.availabilityWindow!,
          date: state.date!,
          area: state.area!,
          price,
          workerPayout,
          status: "pending",
        });
        
        state.step = "complete";
        conversations.delete(phone);
        
        return `*Booking Confirmed!*

Your booking #${job.id.slice(0, 8)} has been received.

We'll match you with a verified cleaner and notify you shortly.

Thank you for using MaidSync!

Send 'hi' to make another booking.`;
      } else if (input === "no" || input === "n" || input === "cancel") {
        conversations.delete(phone);
        return "Booking cancelled. Send 'hi' to start a new booking.";
      }
      return "Please reply *YES* to confirm or *NO* to cancel.";

    default:
      state.step = "start";
      return processMessage(phone, message);
  }
}

async function sendWhatsAppMessage(to: string, body: string): Promise<boolean> {
  if (!accountSid || !authToken || !twilioNumber) {
    console.log("Twilio not configured. Message would be sent to:", to);
    console.log("Message:", body);
    return false;
  }
  
  try {
    const client = twilio(accountSid, authToken);
    await client.messages.create({
      from: `whatsapp:${twilioNumber}`,
      to: `whatsapp:${to}`,
      body,
    });
    return true;
  } catch (error) {
    console.error("Failed to send WhatsApp message:", error);
    return false;
  }
}

export async function notifyWorkerOfJob(workerPhone: string, job: any): Promise<boolean> {
  const message = `*New Job Available!*

Area: ${job.area}
Home: ${job.houseSize}
Tasks: ${job.tasks?.join(", ")}
Date: ${job.date}
You earn: R${job.workerPayout}

Reply ACCEPT to take this job.`;

  return sendWhatsAppMessage(workerPhone, message);
}

export function registerWhatsAppRoutes(app: Express) {
  app.post("/api/whatsapp/webhook", async (req: Request, res: Response) => {
    try {
      const from = req.body.From?.replace("whatsapp:", "") || "";
      const body = req.body.Body || "";
      
      console.log(`WhatsApp message from ${from}: ${body}`);
      
      const response = await processMessage(from, body);
      
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${response}</Message>
</Response>`;
      
      res.type("text/xml");
      res.send(twiml);
    } catch (error) {
      console.error("WhatsApp webhook error:", error);
      res.status(500).send("Error processing message");
    }
  });
  
  app.get("/api/whatsapp/status", (req: Request, res: Response) => {
    res.json({
      configured: !!(accountSid && authToken && twilioNumber),
      activeConversations: conversations.size,
    });
  });
  
  app.post("/api/whatsapp/test", async (req: Request, res: Response) => {
    const { phone, message } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ error: "Phone and message required" });
    }
    
    const response = await processMessage(phone, message);
    res.json({ response });
  });
}
