import { z } from "zod";

export const RelayCapabilitySetSchema = z.object({
  dom: z.boolean().default(true),
  console: z.boolean().default(true),
  network: z.boolean().default(true),
  touch: z.boolean().default(false),
  screenshot: z.boolean().default(false),
  screenRecording: z.boolean().default(false),
  haptics: z.boolean().default(false),
  geolocation: z.boolean().default(false),
  battery: z.boolean().default(false),
  webgl: z.boolean().default(false),
  webrtc: z.boolean().default(false),
  viewportResize: z.boolean().default(true),
});

export type RelayCapabilitySet = z.infer<typeof RelayCapabilitySetSchema>;

export const ReceiverDescriptorSchema = z.object({
  receiverId: z.string().min(1),
  deviceType: z.enum([
    "mobile_browser",
    "desktop_browser",
    "android_native",
    "ios_native",
    "cli",
  ]),
  browserName: z.string().optional(),
  browserVersion: z.string().optional(),
  osName: z.string().optional(),
  osVersion: z.string().optional(),
  model: z.string().optional(),
  capabilities: RelayCapabilitySetSchema,
  protocolVersion: z.number().int().min(1).default(1),
});

export type ReceiverDescriptor = z.infer<typeof ReceiverDescriptorSchema>;
