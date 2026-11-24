import { test } from "node:test";
import assert from "node:assert/strict";
import { numeroWhatsApp, enlaceWhatsApp } from "@/lib/whatsapp";

test("acepta celulares peruanos escritos de distintas formas", () => {
  assert.equal(numeroWhatsApp("942 608 498"), "51942608498");
  assert.equal(numeroWhatsApp("+51 942-608-498"), "51942608498");
});

test("rechaza teléfonos fijos o incompletos", () => {
  assert.equal(numeroWhatsApp("042 551234"), null);
  assert.equal(numeroWhatsApp(""), null);
  assert.equal(enlaceWhatsApp(null, "Hola"), null);
});

test("el enlace lleva el mensaje codificado", () => {
  assert.equal(enlaceWhatsApp("942608498", "Hola, ¿qué tal?"), "https://wa.me/51942608498?text=Hola%2C%20%C2%BFqu%C3%A9%20tal%3F");
});
