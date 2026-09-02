/**
 * Mexico rules core — shared by the Baja California and Baja California Sur packs.
 *
 * Founder question (2026-09-02): "I don't think there's many rule changes between Baja
 * and Baja Sur — research it." Answer: the catch-limit layer is FEDERAL — NOM-017-PESC-
 * 1994 applies nationwide, so the two state packs carry the same clauses against their
 * own areas. (State-level differences live in licensing boats/parks, not bag limits.)
 *
 * Verbatims are lifted from the Norm as published in the Diario Oficial de la
 * Federación (gob.mx/cms/.../NOM_017_PESC.pdf) and the FONMAR mirror; clause numbers are
 * quoted (4.7, 4.7.1, 4.8–4.10) and the two-tier composition rule is stated per species
 * group the way CONAPESCA's own English-language card states it.
 */
import type { RegRule } from "./types";

const NOM = {
  url: "https://www.gob.mx/cms/uploads/attachment/file/311370/NOM_017_PESC.pdf",
  title: "NORMA Oficial Mexicana NOM-017-PESC-1994 (DOF) — pesca deportivo-recreativa",
  updated: null,
};
const GUIA = {
  url: "https://www.gob.mx/conapesca/documentos/guia-de-pesca-deportiva?state=published",
  title: "CONAPESCA — Guía de Pesca Deportiva",
  updated: null,
};
const VERIFIED = "2026-09-02";

function rule(r: Omit<RegRule, "packVersion" | "regGroupId">): RegRule {
  return { regGroupId: null, ...r, packVersion: 1 };
}

/** Federal sport-fishing clauses applied to a given state area. */
export function mexicoFederalRules(regAreaId: string): readonly RegRule[] {
  return [
    rule({
      id: `mx-composition-10-${regAreaId}`, speciesId: null, regAreaId, kind: "note",
      verbatim:
        "4.7.1 Diez ejemplares diarios por pescador, con la siguiente composición por especie: No más de cinco de una misma especie. (Ten fish per person per day, no more than five of a single species.)",
      sourceUrl: NOM.url, sourceTitle: NOM.title, sourceUpdatedAt: NOM.updated, verifiedAt: VERIFIED,
      seasonStart: null, seasonEnd: null, bagDaily: 10, possessionLimit: 10, bagSharesWithGroup: false,
      minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "Total-day composite rule; per-species ceilings below.",
      checkInseason: false, staleAfterDays: 90,
    }),
    rule({
      id: `mx-marlin-1-${regAreaId}`, speciesId: "striped_marlin", regAreaId, kind: "bag_limit",
      verbatim:
        "Cuando se trate de marlin, pez vela, pez espada y tiburón, el límite máximo por pescador y día será de un solo ejemplar de cualquiera de estas especies, el cual será equivalente a cinco ejemplares de otras especies. (For marlin, sailfish, swordfish or shark: ONE specimen a day of any of these — counting as five of the day's ten.)",
      sourceUrl: NOM.url, sourceTitle: NOM.title, sourceUpdatedAt: NOM.updated, verifiedAt: VERIFIED,
      seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
      minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null,
      depthNote: "One billfish/shark of ANY of those species per day; counts as 5 of the 10.",
      checkInseason: false, staleAfterDays: 90,
    }),
    rule({
      id: `mx-sailfish-1-${regAreaId}`, speciesId: "sailfish", regAreaId, kind: "bag_limit",
      verbatim:
        "Cuando se trate de marlin, pez vela, pez espada y tiburón, el límite máximo por pescador y día será de un solo ejemplar de cualquiera de estas especies... (For marlin, sailfish, swordfish or shark: ONE specimen a day of any of these, counting as five of the day's ten.)",
      sourceUrl: NOM.url, sourceTitle: NOM.title, sourceUpdatedAt: NOM.updated, verifiedAt: VERIFIED,
      seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
      minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "Shared with marlin/shark group — one total.",
      checkInseason: false, staleAfterDays: 90,
    }),
    rule({
      id: `mx-dorado-2-${regAreaId}`, speciesId: "dorado", regAreaId, kind: "bag_limit",
      verbatim:
        "En el caso de sábalo, dorado o pez gallo, el límite máximo será de dos ejemplares de dichas especies, el cual será equivalente a cinco ejemplares de otras especies. (For tarpon, dorado or roosterfish: TWO per day from this group, each counting as five of the day's ten.)",
      sourceUrl: NOM.url, sourceTitle: NOM.title, sourceUpdatedAt: NOM.updated, verifiedAt: VERIFIED,
      seasonStart: null, seasonEnd: null, bagDaily: 2, possessionLimit: 2, bagSharesWithGroup: false,
      minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "Two TOTAL across tarpon/dorado/roosterfish; each counts as 5 of the 10.",
      checkInseason: false, staleAfterDays: 90,
    }),
    rule({
      id: `mx-roosterfish-2-${regAreaId}`, speciesId: "roosterfish", regAreaId, kind: "bag_limit",
      verbatim:
        "En el caso de sábalo, dorado o pez gallo, el límite máximo será de dos ejemplares de dichas especies... (Tarpon, dorado or roosterfish: two per day from this group, each counting as five of the day's ten.)",
      sourceUrl: NOM.url, sourceTitle: NOM.title, sourceUpdatedAt: NOM.updated, verifiedAt: VERIFIED,
      seasonStart: null, seasonEnd: null, bagDaily: 2, possessionLimit: 2, bagSharesWithGroup: false,
      minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "Shared 2/day across the group.",
      checkInseason: false, staleAfterDays: 90,
    }),
    rule({
      id: `mx-longtrip-${regAreaId}`, speciesId: null, regAreaId, kind: "note",
      verbatim:
        "4.8 En actividades de pesca deportivo recreativa con embarcaciones cuyos viajes tengan una duración de más de tres días, el número máximo acumulable de ejemplares... será el equivalente a tres días de pesca. (Trips longer than three days may accumulate at most three days' quota.)",
      sourceUrl: NOM.url, sourceTitle: NOM.title, sourceUpdatedAt: NOM.updated, verifiedAt: VERIFIED,
      seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
      minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: "boat", depthNote: null,
      checkInseason: false, staleAfterDays: 90,
    }),
    rule({
      id: `mx-spear-${regAreaId}`, speciesId: null, regAreaId, kind: "gear",
      verbatim:
        "4.9 La pesca subacuática tendrá como límite máximo de captura cinco ejemplares... por pescador y día. (Spearfishing: five fish per person per day, inside the same composition rules.)",
      sourceUrl: NOM.url, sourceTitle: NOM.title, sourceUpdatedAt: NOM.updated, verifiedAt: VERIFIED,
      seasonStart: null, seasonEnd: null, bagDaily: 5, possessionLimit: 5, bagSharesWithGroup: false,
      minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: "diver", depthNote: null,
      checkInseason: false, staleAfterDays: 90,
    }),
    rule({
      id: `mx-catchrelease-${regAreaId}`, speciesId: null, regAreaId, kind: "note",
      verbatim:
        "4.10 ...sin perjuicio de que pueda pescar un mayor número de ejemplares a condición de que los organismos que excedan a dichas cuotas, sean devueltos a su medio natural en buenas condiciones de sobrevivencia («captura y liberación»). (You may continue fishing past quota if the extras are released in good condition — legal catch-and-release.)",
      sourceUrl: NOM.url, sourceTitle: NOM.title, sourceUpdatedAt: NOM.updated, verifiedAt: VERIFIED,
      seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
      minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
      checkInseason: false, staleAfterDays: 90,
    }),
    rule({
      id: `mx-exclusive-${regAreaId}`, speciesId: null, regAreaId, kind: "note",
      verbatim:
        "CONAPESCA Guía de Pesca Deportiva: las especies marlin, pez vela, pez espada, sábalo, pez gallo y pez dorado están destinadas exclusivamente a la pesca deportiva dentro de una franja de 50 millas náuticas; prohibido el desembarco de ejemplares fileteados. (Billfish, tarpon, roosterfish and dorado are sport-only inside 50 nm; you may not land fish already filleted.)",
      sourceUrl: GUIA.url, sourceTitle: GUIA.title, sourceUpdatedAt: GUIA.updated, verifiedAt: VERIFIED,
      seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
      minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
      checkInseason: false, staleAfterDays: 90,
    }),
    rule({
      id: `mx-license-${regAreaId}`, speciesId: null, regAreaId, kind: "note",
      verbatim:
        "La práctica de la pesca deportivo recreativa requiere permiso/licencia de la CONAPESCA... la pesca deportiva comercializable... está prohibida. (A Mexican sport-fishing permit is required for every person fishing; selling sport-caught fish is prohibited. Buy permits via CONAPESCA/authorized dealers.)",
      sourceUrl: GUIA.url, sourceTitle: GUIA.title, sourceUpdatedAt: GUIA.updated, verifiedAt: VERIFIED,
      seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
      minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
      checkInseason: false, staleAfterDays: 90,
    }),
    rule({
      id: `mx-tallas-${regAreaId}`, speciesId: null, regAreaId, kind: "note",
      verbatim:
        "4.11 La práctica de la pesca deportivo recreativa queda sujeta a las tallas y pesos mínimos de captura por especie y zona, que establezca la Secretaría... medidas que se notificarán mediante avisos publicados en el Diario Oficial de la Federación. (Minimum sizes/weights by species and zone are set by DOF notices — check the current Diario Oficial notice before keeping unusual species.)",
      sourceUrl: NOM.url, sourceTitle: NOM.title, sourceUpdatedAt: NOM.updated, verifiedAt: VERIFIED,
      seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
      minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
      checkInseason: true, staleAfterDays: 60,
    }),
  ];
}
