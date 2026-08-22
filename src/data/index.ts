// Content registry. To add a new theme (e.g. hospital / 医療):
//   1. create data/content/hospital.ts exporting a ContentModule
//   2. add it to MODULES below
// Home, area, Q1 shell, discovery, zukan and Q2 all render from this data.
import type { AreaEvent, ContentModule, Place, Profession, Q1Experience } from "./types";
import { schoolLunch } from "./content/schoolLunch";
import { extremeHeat } from "./content/extremeHeat";

const MODULES: ContentModule[] = [schoolLunch, extremeHeat];

export const places: Place[] = MODULES.flatMap((m) => m.places);
export const events: AreaEvent[] = MODULES.flatMap((m) => m.events);
export const professions: Profession[] = MODULES.flatMap((m) => m.professions);
export const experiences: Q1Experience[] = MODULES.flatMap((m) => m.experiences);

export const getEvent = (id: string) => events.find((e) => e.id === id);
export const getProfession = (id: string) => professions.find((p) => p.id === id);
export const getExperience = (id: string) => experiences.find((x) => x.id === id);
