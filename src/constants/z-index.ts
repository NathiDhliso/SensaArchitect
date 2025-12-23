export const Z_INDEX = {
    base: 1,
    dropdown: 100,
    toast: 200,
    modal: 300,
    overlay: 350,
    settingsPanel: 400,
} as const;

export type ZIndexKey = keyof typeof Z_INDEX;
