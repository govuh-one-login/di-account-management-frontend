import { describe, it, expect, vi, afterEach } from "vitest";
import {
  getListOfAccountClientIDs,
  getListOfServiceClientIDs,
  passkeysEnabled,
  getDiscordContactUrl,
  supportDiscordContact,
  getContactEmailServiceUrl,
  getContactEmailAddress,
  supportPhoneContact,
  supportWebchatContact,
} from "../../src/config.js";

describe("config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("UH account contact channels", () => {
    it("does not expose any Discord contact without a verified configured destination", () => {
      vi.stubEnv("DISCORD_CONTACT_URL", undefined);
      expect(supportDiscordContact()).toBe(false);
      expect(getDiscordContactUrl()).toBe("");
    });

    it.each([
      ["https://discord.gg/uh-contact-test", "https://discord.gg/uh-contact-test"],
      ["https://discord.com/channels/123/456", "https://discord.com/channels/123/456"],
    ])("accepts a configured Discord URL at an official Discord host", (link, expected) => {
      vi.stubEnv("DISCORD_CONTACT_URL", link);
      expect(supportDiscordContact()).toBe(true);
      expect(getDiscordContactUrl()).toBe(expected);
    });

    it.each([
      "https://discord.com.attacker.example/invite",
      "http://discord.gg/example",
      "https://example.com/discord",
      "https://user:pass@discord.gg/example",
      "https://discord.com/",
      "not-a-url",
    ])("rejects unapproved or deceptive Discord URLs: %s", (link) => {
      vi.stubEnv("DISCORD_CONTACT_URL", link);
      expect(getDiscordContactUrl()).toBe("");
      expect(supportDiscordContact()).toBe(false);
    });

    it("does not advertise unavailable UK telephone or webchat services", () => {
      vi.stubEnv("SUPPORT_PHONE_CONTACT", "1");
      vi.stubEnv("SUPPORT_WEBCHAT_CONTACT", "1");
      expect(supportPhoneContact()).toBe(false);
      expect(supportWebchatContact()).toBe(false);
    });

    it("accepts an explicitly configured UH secure support destination", () => {
      vi.stubEnv("CONTACT_EMAIL_SERVICE_URL", "https://www.gov.uhrblx.com/contact/");
      expect(getContactEmailServiceUrl()).toBe("https://www.gov.uhrblx.com/contact/");
    });

    it.each([
      "https://home.account.gov.uk/contact",
      "https://gov.uhrblx.com.evil.example/contact",
      "http://www.gov.uhrblx.com/contact",
      "not-a-url",
    ])("does not redirect support requests to an unapproved destination: %s", (link) => {
      vi.stubEnv("CONTACT_EMAIL_SERVICE_URL", link);
      expect(getContactEmailServiceUrl()).toBe("");
    });

    it("only presents a valid explicitly configured email address", () => {
      vi.stubEnv("ONE_LOGIN_CONTACT_EMAIL", "support@example.org");
      expect(getContactEmailAddress()).toBe("support@example.org");
      vi.stubEnv("ONE_LOGIN_CONTACT_EMAIL", "not an email");
      expect(getContactEmailAddress()).toBe("");
    });
  });

  describe("Service configuration", () => {
    it("should have no services in the accounts list that are in the other services list", () => {
      expect(
        getListOfAccountClientIDs.filter((service) =>
          getListOfServiceClientIDs.includes(service)
        ).length
      ).toBe(0);
    });

    it("should have no services in the other services list that are in the accounts list", () => {
      expect(
        getListOfServiceClientIDs.filter((service) =>
          getListOfAccountClientIDs.includes(service)
        ).length
      ).toBe(0);
    });
  });

  describe("passkeysEnabled", () => {
    it("should return false when PASSKEYS env var is not set", () => {
      vi.stubEnv("PASSKEYS", undefined);
      vi.stubEnv("APP_ENV", "local");
      expect(passkeysEnabled()).toBe(false);
    });

    it("should return false when PASSKEYS env var is not '1'", () => {
      vi.stubEnv("PASSKEYS", "0");
      vi.stubEnv("APP_ENV", "local");
      expect(passkeysEnabled()).toBe(false);
    });

    it("should return true when PASSKEYS env var is '1'", () => {
      vi.stubEnv("PASSKEYS", "1");
      vi.stubEnv("APP_ENV", "local");
      expect(passkeysEnabled()).toBe(true);
    });
  });
});
