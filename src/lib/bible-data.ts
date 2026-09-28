export type BookChapters = { name: string; chapters: number };

// Standard Protestant canon chapter counts.
export const OT_BOOKS: BookChapters[] = [
  { name: "Genesis", chapters: 50 },
  { name: "Exodus", chapters: 40 },
  { name: "Leviticus", chapters: 27 },
  { name: "Numbers", chapters: 36 },
  { name: "Deuteronomy", chapters: 34 },
  { name: "Joshua", chapters: 24 },
  { name: "Judges", chapters: 21 },
  { name: "Ruth", chapters: 4 },
  { name: "1 Samuel", chapters: 31 },
  { name: "2 Samuel", chapters: 24 },
  { name: "1 Kings", chapters: 22 },
  { name: "2 Kings", chapters: 25 },
  { name: "1 Chronicles", chapters: 29 },
  { name: "2 Chronicles", chapters: 36 },
  { name: "Ezra", chapters: 10 },
  { name: "Nehemiah", chapters: 13 },
  { name: "Esther", chapters: 10 },
  { name: "Job", chapters: 42 },
  { name: "Psalms", chapters: 150 },
  { name: "Proverbs", chapters: 31 },
  { name: "Ecclesiastes", chapters: 12 },
  { name: "Song of Solomon", chapters: 8 },
  { name: "Isaiah", chapters: 66 },
  { name: "Jeremiah", chapters: 52 },
  { name: "Lamentations", chapters: 5 },
  { name: "Ezekiel", chapters: 48 },
  { name: "Daniel", chapters: 12 },
  { name: "Hosea", chapters: 14 },
  { name: "Joel", chapters: 3 },
  { name: "Amos", chapters: 9 },
  { name: "Obadiah", chapters: 1 },
  { name: "Jonah", chapters: 4 },
  { name: "Micah", chapters: 7 },
  { name: "Nahum", chapters: 3 },
  { name: "Habakkuk", chapters: 3 },
  { name: "Zephaniah", chapters: 3 },
  { name: "Haggai", chapters: 2 },
  { name: "Zechariah", chapters: 14 },
  { name: "Malachi", chapters: 4 },
];

export const NT_BOOKS: BookChapters[] = [
  { name: "Matthew", chapters: 28 },
  { name: "Mark", chapters: 16 },
  { name: "Luke", chapters: 24 },
  { name: "John", chapters: 21 },
  { name: "Acts", chapters: 28 },
  { name: "Romans", chapters: 16 },
  { name: "1 Corinthians", chapters: 16 },
  { name: "2 Corinthians", chapters: 13 },
  { name: "Galatians", chapters: 6 },
  { name: "Ephesians", chapters: 6 },
  { name: "Philippians", chapters: 4 },
  { name: "Colossians", chapters: 4 },
  { name: "1 Thessalonians", chapters: 5 },
  { name: "2 Thessalonians", chapters: 3 },
  { name: "1 Timothy", chapters: 6 },
  { name: "2 Timothy", chapters: 4 },
  { name: "Titus", chapters: 3 },
  { name: "Philemon", chapters: 1 },
  { name: "Hebrews", chapters: 13 },
  { name: "James", chapters: 5 },
  { name: "1 Peter", chapters: 5 },
  { name: "2 Peter", chapters: 3 },
  { name: "1 John", chapters: 5 },
  { name: "2 John", chapters: 1 },
  { name: "3 John", chapters: 1 },
  { name: "Jude", chapters: 1 },
  { name: "Revelation", chapters: 22 },
];

export const OT_TOTAL = OT_BOOKS.reduce((s, b) => s + b.chapters, 0); // 929
export const NT_TOTAL = NT_BOOKS.reduce((s, b) => s + b.chapters, 0); // 260
export const BIBLE_TOTAL = OT_TOTAL + NT_TOTAL; // 1189

export const PLAN_LENGTH_DAYS = 365;

export type ChapterRef = { book: string; chapter: number; testament: "OT" | "NT" };

export type PlanId = "one-year" | "ninety-day" | "custom";
export type CustomGoal = "chapters" | "book-week";

export const DEFAULT_CUSTOM_CHAPTERS = 3;

export const PLAN_OPTIONS: { id: PlanId; name: string; description: string }[] = [
  {
    id: "one-year",
    name: "One-year Bible",
    description:
      "Read 1 New Testament and 3 Old Testament chapters daily. Finish the first read-through in about 310 days, then revisit earlier chapters.",
  },
  {
    id: "ninety-day",
    name: "90-day mixed Bible",
    description: "Read through both Testaments in 90 days.",
  },
  {
    id: "custom",
    name: "Custom goal",
    description: "Choose a daily chapter target or finish one book each week.",
  },
];

function flatten(books: BookChapters[], testament: "OT" | "NT"): ChapterRef[] {
  const out: ChapterRef[] = [];
  for (const b of books) {
    for (let c = 1; c <= b.chapters; c++) {
      out.push({ book: b.name, chapter: c, testament });
    }
  }
  return out;
}

export const OT_SEQUENCE = flatten(OT_BOOKS, "OT");
export const NT_SEQUENCE = flatten(NT_BOOKS, "NT");

export type DayReading = {
  day: number; // 1-indexed
  morning: ChapterRef[];
  night: ChapterRef[];
};

function chapterSlice(sequence: ChapterRef[], start: number, end: number, repeat: boolean) {
  const chapters: ChapterRef[] = [];
  for (let index = start; index < end; index++) {
    if (!repeat && index >= sequence.length) break;
    chapters.push(sequence[index % sequence.length]);
  }
  return chapters;
}

function buildOneYearPlan(): DayReading[] {
  const plan: DayReading[] = [];
  for (let day = 1; day <= PLAN_LENGTH_DAYS; day++) {
    const otStart = (day - 1) * 3;
    plan.push({
      day,
      morning: chapterSlice(NT_SEQUENCE, day - 1, day, true),
      night: chapterSlice(OT_SEQUENCE, otStart, otStart + 3, true),
    });
  }
  return plan;
}

function buildNinetyDayPlan(): DayReading[] {
  const plan: DayReading[] = [];
  for (let day = 1; day <= 90; day++) {
    const ntStart = Math.floor(((day - 1) * NT_TOTAL) / 90);
    const ntEnd = Math.floor((day * NT_TOTAL) / 90);
    const otStart = Math.floor(((day - 1) * OT_TOTAL) / 90);
    const otEnd = Math.floor((day * OT_TOTAL) / 90);
    plan.push({
      day,
      morning: chapterSlice(NT_SEQUENCE, ntStart, ntEnd, false),
      night: chapterSlice(OT_SEQUENCE, otStart, otEnd, false),
    });
  }
  return plan;
}

function buildCustomChapterPlan(chaptersPerDay: number): DayReading[] {
  const sequence = [...OT_SEQUENCE, ...NT_SEQUENCE];
  const days = Math.ceil(sequence.length / chaptersPerDay);
  const plan: DayReading[] = [];

  for (let day = 1; day <= days; day++) {
    const readings = sequence.slice((day - 1) * chaptersPerDay, day * chaptersPerDay);
    plan.push({
      day,
      morning: readings.filter((reading) => reading.testament === "NT"),
      night: readings.filter((reading) => reading.testament === "OT"),
    });
  }
  return plan;
}

function buildBookPerWeekPlan(): DayReading[] {
  const plan: DayReading[] = [];
  let day = 1;

  for (const book of [...OT_BOOKS, ...NT_BOOKS]) {
    const sequence = flatten([book], OT_BOOKS.includes(book) ? "OT" : "NT");
    for (let weekDay = 0; weekDay < 7; weekDay++) {
      const start = Math.floor((weekDay * sequence.length) / 7);
      const end = Math.floor(((weekDay + 1) * sequence.length) / 7);
      const readings = sequence.slice(start, end);
      plan.push({
        day,
        morning: readings.filter((reading) => reading.testament === "NT"),
        night: readings.filter((reading) => reading.testament === "OT"),
      });
      day++;
    }
  }
  return plan;
}

export function buildPlan(
  planId: PlanId = "one-year",
  customGoal: CustomGoal = "chapters",
  chaptersPerDay = DEFAULT_CUSTOM_CHAPTERS
): DayReading[] {
  if (planId === "ninety-day") return buildNinetyDayPlan();
  if (planId === "custom") {
    return customGoal === "book-week"
      ? buildBookPerWeekPlan()
      : buildCustomChapterPlan(Math.max(1, Math.min(20, Math.floor(chaptersPerDay))));
  }
  return buildOneYearPlan();
}

export function refLabel(ref: ChapterRef): string {
  return `${ref.book} ${ref.chapter}`;
}

export function readingLabel(readings: ChapterRef[]): string {
  return readings.map(refLabel).join(", ");
}
