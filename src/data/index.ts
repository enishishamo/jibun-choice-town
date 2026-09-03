// Content registry. To add a new theme (e.g. hospital / 医療):
//   1. create data/content/hospital.ts exporting a ContentModule
//   2. add it to MODULES below
// Home, area, Q1 shell, discovery, zukan and Q2 all render from this data.
import type { AreaEvent, ContentModule, Place, Profession, Q1Experience } from "./types";
import { schoolLunch } from "./content/schoolLunch";
import { extremeHeat } from "./content/extremeHeat";
import { priceHike } from "./content/priceHike";
import { townEvent } from "./content/townEvent";
import { medical } from "./content/medical";
import { schoolTrip } from "./content/schoolTrip";
import { shopOpening } from "./content/shopOpening";
import { waste } from "./content/waste";
import { zoo } from "./content/zoo";
import { port } from "./content/port";
import { forest } from "./content/forest";
import { river } from "./content/river";
import { library } from "./content/library";
import { studio } from "./content/studio";

const MODULES: ContentModule[] = [schoolLunch, extremeHeat, priceHike, townEvent, medical, schoolTrip, shopOpening, waste, zoo, port, forest, river, library, studio];

export const places: Place[] = MODULES.flatMap((m) => m.places);
export const events: AreaEvent[] = MODULES.flatMap((m) => m.events);
export const professions: Profession[] = MODULES.flatMap((m) => m.professions);
export const experiences: Q1Experience[] = MODULES.flatMap((m) => m.experiences);

export const getEvent = (id: string) => events.find((e) => e.id === id);
export const getProfession = (id: string) => professions.find((p) => p.id === id);
export const getExperience = (id: string) => experiences.find((x) => x.id === id);

